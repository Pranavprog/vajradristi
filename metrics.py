import torch

def compute_iou(pred, target, num_classes):
    """
    Computes the Intersection over Union (IoU) metric per class.
    IoU is crucial for hackathon evaluations as it penalizes false positives and false negatives.
    
    Args:
        pred: Tensor of shape (N, H, W) containing predicted class indices
        target: Tensor of shape (N, H, W) containing ground truth class indices
        num_classes: int, total number of classes
        
    Returns:
        ious: List of IoU scores for each class
        miou: Mean IoU score across all valid classes
    """
    ious = []
    pred = pred.view(-1)
    target = target.view(-1)

    for cls in range(num_classes):
        pred_inds = pred == cls
        target_inds = target == cls
        
        intersection = (pred_inds[target_inds]).long().sum().item()
        union = pred_inds.long().sum().item() + target_inds.long().sum().item() - intersection
        
        if union == 0:
            # Class not present in this batch, append NaN to ignore in mean calculation
            ious.append(float('nan'))
        else:
            ious.append(intersection / max(union, 1))
            
    # Compute mean IoU ignoring NaNs
    valid_ious = [iou for iou in ious if not torch.isnan(torch.tensor(iou))]
    miou = sum(valid_ious) / len(valid_ious) if valid_ious else 0.0
    
    return ious, miou

def compute_accuracy(pred, target):
    """
    Computes overall Pixel Accuracy.
    """
    correct = (pred == target).sum().item()
    total = target.numel()
    return correct / total
