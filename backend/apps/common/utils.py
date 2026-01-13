from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image


def compress_image(image_field, max_size=(1920, 1920), quality=70):
    """
    Compresses the image in the given image_field.
    """
    if not image_field:
        return

    try:
        img = Image.open(image_field)

        # Convert to RGB if necessary (e.g. for PNG with transparency)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # Resize if dimensions are larger than max_size
        img.thumbnail(max_size, Image.Resampling.LANCZOS)

        # Save to BytesIO
        output = BytesIO()
        img.save(output, format='JPEG', quality=quality)
        output.seek(0)

        # Update the image field with the compressed content
        # Change extension to .jpg
        new_name = image_field.name.rsplit('.', 1)[0] + '.jpg'

        return ContentFile(output.read(), name=new_name)
    except Exception as e:
        print(f'Error compressing image: {e}')
        return None
