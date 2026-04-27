import matplotlib.pyplot as plt
import numpy as np

def plot_training_curves(train_losses, val_losses, val_ious, save_path="training_curves.png"):
    """
    Plots and saves the training and validation curves.
    Essential for presentation to show model convergence and lack of overfitting.
    """
    epochs = range(1, len(train_losses) + 1)
    
    plt.figure(figsize=(12, 5))
    
    # Plot Training and Validation Loss
    plt.subplot(1, 2, 1)
    plt.plot(epochs, train_losses, label='Train Loss', marker='o')
    plt.plot(epochs, val_losses, label='Val Loss', marker='s')
    plt.title('Training and Validation Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)
    
    # Plot Validation IoU
    plt.subplot(1, 2, 2)
    plt.plot(epochs, val_ious, label='Val mIoU', color='green', marker='^')
    plt.title('Validation Mean IoU')
    plt.xlabel('Epochs')
    plt.ylabel('mIoU')
    plt.legend()
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()

def map_risk_dynamic(segmentation_mask, confidence_mask=None, depth_map=None):
    """
    Calculates Dynamic Risk Map based on: Risk = Object Type + Distance + Density.
    Risk Score = Base Risk * Proximity Factor * Density Factor
    
    Args:
        segmentation_mask: 2D numpy array of predicted class indices.
        confidence_mask: Optional 2D numpy array (0.0 to 1.0) of model confidence.
        depth_map: Optional 2D numpy array representing physical distance.
                   If None, we approximate proximity using vertical image position.
                   
    Returns:
        risk_map_rgb: 3D numpy array (H, W, 3) representing the color-coded risk.
    """
    h, w = segmentation_mask.shape
    risk_map_rgb = np.zeros((h, w, 3), dtype=np.uint8)
    
    # Define Base Risk for classes (Assumed class semantics for off-road)
    # 0: background (unknown), 1: ground/trail (safe), 2: bush/grass (moderate), 3: rocks/logs (high), 4: sky (safe)
    base_risk = {
        0: 0.2,  # Unknown
        1: 0.1,  # Ground/Trail -> Safe
        2: 0.5,  # Bushes/Grass -> Moderate
        3: 0.9,  # Rocks/Logs -> High Risk
        4: 0.0,  # Sky -> Safe
    }
    
    for i in range(h):
        # 1. Distance (Proximity Factor)
        if depth_map is not None:
            # Assume depth_map is normalized 0.0 (far) to 1.0 (close)
            proximity_factor = 1.0 + depth_map[i, 0] * 0.5
        else:
            # Pseudo-depth: Bottom of image (higher row index i) is closer to the vehicle
            proximity_factor = 1.0 + (i / h) * 0.5  # Scales from 1.0 (top) to 1.5 (bottom)
        
        for j in range(w):
            class_idx = int(segmentation_mask[i, j])
            b_risk = base_risk.get(class_idx, 0.3)
            
            # 2. Density Factor (Approximated via Confidence for this hackathon demo)
            # In a full system, density would be computed by analyzing local patches.
            density_factor = 1.0
            
            # If the model prediction confidence is low, we conservatively increase the risk
            if confidence_mask is not None and confidence_mask[i, j] < 0.6:
                density_factor *= 1.3
                
            # Final Risk Calculation
            risk_score = b_risk * proximity_factor * density_factor
            
            # 3. Map risk_score to colors for visualization
            if risk_score > 0.8:
                risk_map_rgb[i, j] = [255, 0, 0]     # Red: HIGH RISK
            elif risk_score > 0.4:
                risk_map_rgb[i, j] = [255, 255, 0]   # Yellow: MODERATE
            else:
                risk_map_rgb[i, j] = [0, 255, 0]     # Green: SAFE
                
    return risk_map_rgb

def display_results(image, pred_mask, risk_map, save_path="inference_output.png"):
    """
    Plots the input image, predicted segmentation mask, and dynamic risk map side-by-side.
    """
    plt.figure(figsize=(15, 5))
    
    plt.subplot(1, 3, 1)
    # If image is a tensor, we need to convert it back properly
    if isinstance(image, torch.Tensor):
        # Denormalize ImageNet stats
        mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
        std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
        image = image * std + mean
        image = image.permute(1, 2, 0).cpu().numpy()
        image = np.clip(image, 0, 1)
        
    plt.imshow(image)
    plt.title('Original Input Image')
    plt.axis('off')
    
    plt.subplot(1, 3, 2)
    plt.imshow(pred_mask, cmap='nipy_spectral') # Good colormap for segmentation
    plt.title('Predicted Segmentation')
    plt.axis('off')
    
    plt.subplot(1, 3, 3)
    plt.imshow(risk_map)
    plt.title('Dynamic Risk Map')
    plt.axis('off')
    
    plt.tight_layout()
    plt.savefig(save_path, bbox_inches='tight')
    plt.close()
