from django.test import TestCase
from .models import Location

class LocationModelTests(TestCase):
    def test_create_location(self):
        """Test creating a location."""
        loc = Location.objects.create(name="Main Warehouse", description="Storage area")
        self.assertEqual(loc.name, "Main Warehouse")
        self.assertEqual(loc.description, "Storage area")

    def test_location_hierarchy(self):
        """Test parent-child relationship."""
        parent = Location.objects.create(name="Building A")
        child = Location.objects.create(name="Room 101", parent=parent)
        
        self.assertEqual(child.parent, parent)
        self.assertIn(child, parent.children.all())

    def test_location_str_representation(self):
        """Test string representation with hierarchy."""
        root = Location.objects.create(name="Root")
        child = Location.objects.create(name="Child", parent=root)
        grandchild = Location.objects.create(name="Grandchild", parent=child)
        
        self.assertEqual(str(root), "Root")
        self.assertEqual(str(child), "Root > Child")
        self.assertEqual(str(grandchild), "Root > Child > Grandchild")
