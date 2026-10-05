from django.core.management.base import BaseCommand
from core.mongodb import check_mongo_connection, sync_django_to_mongodb

class Command(BaseCommand):
    help = "Sync Learnova relational models to MongoDB collections"

    def handle(self, *args, **options):
        self.stdout.write("Checking MongoDB connection...")
        status = check_mongo_connection()
        if not status.get("connected"):
            self.stderr.write(self.style.ERROR(f"Failed to connect to MongoDB: {status.get('error')}"))
            return

        self.stdout.write(self.style.SUCCESS(f"Connected to MongoDB v{status.get('mongodb_version')} (Database: {status.get('database')})"))
        self.stdout.write("Syncing data to collections...")
        results = sync_django_to_mongodb()
        for collection, count in results.items():
            self.stdout.write(f"  - {collection}: {count} documents synced")
        self.stdout.write(self.style.SUCCESS("MongoDB synchronization complete!"))
