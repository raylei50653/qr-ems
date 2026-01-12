from django.db import transaction
from apps.transactions.models import Transaction
from apps.equipment.models import Equipment

def update_equipment_with_transaction(serializer, user, image=None):
    """
    Updates an equipment instance via its serializer and logs a transaction
    if status or location changes.
    """
    instance = serializer.instance
    
    # Capture old state before saving
    old_status = instance.status
    old_location = instance.location
    old_zone = instance.zone
    old_cabinet = instance.cabinet
    old_number = instance.number

    with transaction.atomic():
        # Perform the actual update
        updated_instance = serializer.save()

        new_status = updated_instance.status
        new_location = updated_instance.location
        new_zone = updated_instance.zone
        new_cabinet = updated_instance.cabinet
        new_number = updated_instance.number
        
        action_type = None
        reason = ""

        # Status based transitions
        if old_status != new_status:
            if new_status == Equipment.Status.IN_TRANSIT:
                action_type = 'MOVE_START'
                reason = f"Status changed from {old_status} to {new_status}"
            elif old_status == Equipment.Status.IN_TRANSIT and new_status == Equipment.Status.AVAILABLE:
                action_type = 'MOVE_CONFIRM'
                reason = f"Status changed from {old_status} to {new_status}"
        
        # Location based transitions (Direct Move or Correction)
        # Only log if action_type is not yet set (to avoid double logging if covered by status change)
        if not action_type and new_status == Equipment.Status.AVAILABLE:
            location_changed = (old_location != new_location) or \
                               (old_zone != new_zone) or \
                               (old_cabinet != new_cabinet) or \
                               (old_number != new_number)
            
            if location_changed:
                action_type = 'MOVE_CONFIRM' # Treat direct location change as immediate move confirmation
                reason = "Direct location update"
        
        if action_type:
            # Create a transaction record with location snapshot
            Transaction.objects.create(
                equipment=updated_instance,
                user=user,
                action=action_type,
                status=Transaction.Status.COMPLETED,
                image=image,
                location=updated_instance.location,
                zone=updated_instance.zone,
                cabinet=updated_instance.cabinet,
                number=updated_instance.number,
                reason=reason
            )
            
    return updated_instance
