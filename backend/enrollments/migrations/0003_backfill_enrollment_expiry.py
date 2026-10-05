from datetime import timedelta

from django.db import migrations
from django.utils import timezone

DEFAULT_GRANT_DAYS = 90


def backfill_expiry(apps, schema_editor):
    """Enrollments created before expiry existed have no end date, which would
    grant them permanent access. Give them a bounded window instead."""
    Enrollment = apps.get_model('enrollments', 'Enrollment')
    Enrollment.objects.filter(expires_at__isnull=True).update(
        expires_at=timezone.now() + timedelta(days=DEFAULT_GRANT_DAYS)
    )


class Migration(migrations.Migration):

    dependencies = [
        ('enrollments', '0002_enrollment_expires_at_enrollment_payment_and_more'),
    ]

    operations = [
        # Irreversible on purpose: once a backfilled row is indistinguishable
        # from a row that always had an expiry, un-backfilling would wrongly
        # strip real expiry dates.
        migrations.RunPython(backfill_expiry, migrations.RunPython.noop),
    ]