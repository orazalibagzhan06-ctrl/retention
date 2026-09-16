#!/usr/bin/env python3
"""Refresh payment status only for the frozen MS roster.
Credentials are supplied at run time through JUZ_USERNAME and JUZ_PASSWORD.
Never adds/removes roster records.
"""
from __future__ import annotations
import json, os, re, sys, subprocess
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDENTS_FILE = ROOT / 'lib' / 'students.ts'
GROUPS_FILE = ROOT / 'lib' / 'current-groups.ts'
API = 'https://api.juz40-edu.kz'


def load_ts_json(path: Path, marker: str):
    text = path.read_text()
    start = text.index(marker) + len(marker)
    end = text.rindex(';')
    return json.loads(text[start:end].removesuffix(' as const'))


def request_json(path: str, token: str | None = None, body: dict | None = None):
    command = ['curl', '-sS', '--fail', API + path, '-H', 'Content-Type: application/json']
    if token:
        command.extend(['-H', f'Authorization: Bearer {token}'])
    if body is not None:
        command.extend(['-X', 'POST', '--data', json.dumps(body)])
    result = subprocess.run(command, check=True, capture_output=True, text=True, timeout=45)
    return json.loads(result.stdout)


def state(raw: dict) -> str:
    if raw.get('prolongStatus') == 'PROLONGED':
        return 'paid'
    if raw.get('prolongDecision') == 'WILL_LEAVE':
        return 'left'
    if raw.get('prolongStatus') and raw.get('prolongStatus') != 'NOT_EXIST':
        return 'waiting'
    return 'unknown'


def main():
    username = os.environ.get('JUZ_USERNAME')
    password = os.environ.get('JUZ_PASSWORD')
    if not username or not password:
        raise SystemExit('JUZ_USERNAME and JUZ_PASSWORD are required.')

    students = load_ts_json(STUDENTS_FILE, 'export const students: Student[] = ')
    groups = load_ts_json(GROUPS_FILE, 'export const currentGroups = ')
    frozen_ids = {student['id'] for student in students}
    if len(students) != 3998 or len(frozen_ids) != 3998:
        raise SystemExit(f'Frozen roster check failed: {len(students)} rows, {len(frozen_ids)} unique IDs.')

    login = request_json('/v1/auth/signin', body={'username': username, 'password': password})
    token = login.get('token')
    if not token:
        raise SystemExit('JUZ40 sign-in failed.')

    fresh = {}
    available_ids = set()
    errors = []
    for group in groups:
        try:
            result = request_json(f"/v3/headteacher/groups/{group['id']}/students", token)
            for raw in result.get('students', []):
                available_ids.add(raw['id'])
                fresh[raw['id']] = raw
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
            errors.append(f"{group['id']}: data unavailable")

    if errors:
        raise SystemExit('Could not read all frozen groups: ' + '; '.join(errors))

    updated = 0
    for student in students:
        raw = fresh.get(student['id'])
        if not raw:
            continue
        next_state = state(raw)
        next_decision = raw.get('prolongDecision') or ''
        cause = raw.get('prolongCause') or {}
        next_reason = (cause.get('nameKz') or cause.get('name') or '') if isinstance(cause, dict) else str(cause)
        if (student['paymentState'], student['decision'], student['reason']) != (next_state, next_decision, next_reason):
            updated += 1
            student['paymentState'] = next_state
            student['decision'] = next_decision
            student['reason'] = next_reason

    today = datetime.now().strftime('%d.%m.%Y')
    iso_today = datetime.now().strftime('%Y-%m-%d')
    paid_by_group = Counter(student['groupId'] for student in students if student['paymentState'] == 'paid')
    known_by_group = defaultdict(bool)
    for student in students:
        if student['paymentState'] != 'unknown':
            known_by_group[student['groupId']] = True
    for group in groups:
        group['renewed'] = paid_by_group[group['id']] if known_by_group[group['id']] else None
        group['source'] = f'JUZ40 · {today}'
        group['updated'] = iso_today

    STUDENTS_FILE.write_text(
        "export type PaymentState = 'paid' | 'waiting' | 'left' | 'unknown';\n"
        "export type Student = { id: string; name: string; groupId: string; curator: string; stream: string; streamLabel: string; paymentState: PaymentState; decision: string; reason: string };\n"
        + 'export const students: Student[] = ' + json.dumps(students, ensure_ascii=False, separators=(',', ':')) + ';\n'
    )
    GROUPS_FILE.write_text('export const currentGroups = ' + json.dumps(groups, ensure_ascii=False, separators=(',', ':')) + ' as const;\n')

    counts = Counter(student['paymentState'] for student in students)
    missing = len(frozen_ids - available_ids)
    print(json.dumps({
        'frozenRoster': len(students), 'matched': len(frozen_ids & available_ids),
        'notReturnedByJuz': missing, 'recordsChanged': updated,
        'paid': counts['paid'], 'waiting': counts['waiting'],
        'left': counts['left'], 'unknown': counts['unknown']
    }, ensure_ascii=False))

if __name__ == '__main__':
    main()
