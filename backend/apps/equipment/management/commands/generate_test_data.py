import random

from django.core.management.base import BaseCommand

from apps.equipment.models import Equipment


class Command(BaseCommand):
    help = 'Generates extensive test data for equipment'

    def handle(self, *_args, **_kwargs):
        # Clear existing data
        self.stdout.write('Clearing existing equipment...')
        Equipment.objects.all().delete()

        # Category Mapping
        category_map = {
            'Laptop': Equipment.Category.LAPTOP,
            'Monitor': Equipment.Category.MONITOR,
            'Peripherals': Equipment.Category.PERIPHERALS,
            'Audio/Video': Equipment.Category.AUDIO_VIDEO,
            'Furniture': Equipment.Category.FURNITURE,
            'Development Boards': Equipment.Category.DEV_BOARD,
            'Tablet': Equipment.Category.TABLET,
            'Phone': Equipment.Category.PHONE,
            'Network': Equipment.Category.NETWORK,
            'Tools': Equipment.Category.TOOLS,
        }

        categories_data = {
            'Laptop': [
                'MacBook Air M2',
                'MacBook Pro M1',
                'Dell XPS 13',
                'Lenovo ThinkPad X1',
                'HP Spectre x360',
                'Asus ZenBook Duo',
            ],
            'Monitor': [
                'Dell UltraSharp 27',
                'LG 27UN850',
                'BenQ PD3220U',
                'Samsung Odyssey G9',
                'ViewSonic ColorPro',
            ],
            'Peripherals': [
                'Logitech MX Keys',
                'Keychron K3',
                'Magic Mouse 2',
                'Wacom Intuos Pro',
                'Elgato Stream Deck',
            ],
            'Audio/Video': [
                'Sony WH-1000XM5',
                'Bose QC45',
                'Blue Yeti Microphone',
                'Logitech C920 Webcam',
                'Canon EOS R5',
            ],
            'Furniture': [
                'Herman Miller Aeron',
                'Steelcase Leap',
                'IKEA Markus',
                'Standing Desk (Motorized)',
                'Whiteboard (Mobile)',
            ],
            'Development Boards': [
                'Raspberry Pi 5',
                'Arduino Uno R3',
                'Jetson Nano',
                'ESP32 DevKit',
                'STM32 Nucleo',
            ],
            'Tablet': [
                'iPad Pro 12.9',
                'Samsung Galaxy Tab S9',
                'iPad Mini 6',
                'Microsoft Surface Pro 9',
            ],
            'Phone': [
                'iPhone 15 Pro',
                'Google Pixel 8',
                'Samsung Galaxy S24',
                'iPhone SE 3',
            ],
            'Network': [
                'Ubiquiti UniFi Dream Machine',
                'Cisco Switch 2960',
                'Synology NAS DS923+',
                'Starlink Kit',
                'Netgear Router',
            ],
            'Tools': [
                'Soldering Iron Station',
                '3D Printer Ender 3',
                'Digital Multimeter',
                'Electric Screwdriver Set',
                'Laser Cutter',
            ],
        }

        statuses = [
            Equipment.Status.AVAILABLE,
        ]

        self.stdout.write('Generating extended equipment data with new categories...')

        created_count = 0
        for cat_key, items in categories_data.items():
            db_category = category_map.get(cat_key, Equipment.Category.OTHER)

            for name in items:
                # Create variations
                for i in range(1, 3):  # Create 2 of each
                    full_name = f'{name} #{i}'

                    # Randomized description
                    desc_prefix = f'這是一台屬於 {cat_key} 類別的設備。'
                    desc_suffix = (
                        '適合辦公或開發使用。' if i == 1 else '備用機，狀況良好。'
                    )

                    status = random.choice(statuses)

                    equipment = Equipment.objects.create(
                        name=full_name,
                        description=f'{desc_prefix} {desc_suffix}',
                        status=status,
                        category=db_category,
                        rdf_metadata={
                            'legacy_category': cat_key,
                            'specs': 'Standard Config',
                            'test_batch': 'v4_expanded',
                        },
                    )
                    self.stdout.write(f'Created: [{db_category}] {equipment.name}')
                    created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {created_count} equipment items.'
            )
        )
