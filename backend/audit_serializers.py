"""Static audit: every declared serializer field must be either a model field
or an explicitly declared serializer field. DRF raises at runtime otherwise."""
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learnova_server.settings')
django.setup()

from rest_framework import serializers  # noqa: E402

import accounts.serializers as a  # noqa: E402
import courses.serializers as c  # noqa: E402
import enrollments.serializers as e  # noqa: E402
import notifications.serializers as n  # noqa: E402
import payments.serializers as p  # noqa: E402

problems = []
for module in (a, c, e, n, p):
    for name in dir(module):
        obj = getattr(module, name)
        if not (isinstance(obj, type) and issubclass(obj, serializers.ModelSerializer)):
            continue
        meta = getattr(obj, 'Meta', None)
        if meta is None or not hasattr(meta, 'fields'):
            continue
        try:
            fields = obj().get_fields()
        except Exception as exc:  # noqa: BLE001
            problems.append(f"{module.__name__}.{name}: cannot build fields -> {exc}")
            continue
        declared = set(meta.fields)
        known = set(fields.keys())
        missing = declared - known
        if missing:
            problems.append(
                f"{module.__name__}.{name}: undeclared field(s) {sorted(missing)}"
            )

if problems:
    print("SERIALIZER FIELD PROBLEMS:")
    for problem in problems:
        print("  -", problem)
else:
    print("All serializer fields OK.")