import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from tqdm import tqdm

from models.segmentation_model import VajraDristiModel
from utils.dataset import TerrainDataset
from utils.metrics import compute_iou, compute_accuracy
from utils.visualization import plot_training_curves

# --- HYPERPARAMETERS ---
BATCH_SIZE = 8
EPOCHS = 30
LEARNING_RATE = 1e-3
NUM_CLASSES = 5 # Example mapping: 0: Unknown, 1: Ground, 2: Bush, 3: Rocks, 4: Sky
# Adjusted path to match the user's workspace
DATA_DIR = "../Offroad_Segmentation_Training_Dataset" 
SAVE_PATH = "vajradristi_best.pth"

def dice_loss(pred, target, smooth=1.):
    """
    Simple Dice Loss implementation.
    Helps significantly with class imbalance (e.g., small rocks vs large sky).
    """
    pred = torch.softmax(pred, dim=1)
    target_one_hot = torch.nn.functional.one_hot(target, num_classes=pred.shape[1]).permute(0, 3, 1, 2).float()
    
    intersection = (pred * target_one_hot).sum(dim=(2, 3))
    union = pred.sum(dim=(2, 3)) + target_one_hot.sum(dim=(2, 3))
    
    dice = (2. * intersection + smooth) / (union + smooth)
    return 1 - dice.mean()

def train():
    """
    Main training loop optimized for hackathons: fast, clean, and uses mixed precision.
    """
    # 1. Device configuration (GPU if available)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # 2. DataLoaders
    train_dataset = TerrainDataset(root_dir=DATA_DIR, split='train')
    val_dataset = TerrainDataset(root_dir=DATA_DIR, split='val')
    
    # num_workers=0 used here for broad compatibility, increase to 4 on robust machines
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=True)
    
    # 3. Model Initialization
    model = VajraDristiModel(num_classes=NUM_CLASSES).to(device)
    
    # 4. Loss and Optimizer
    ce_loss = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)
    
    # Mixed Precision Training (AMP) scaler for faster training and reduced memory
    scaler = torch.cuda.amp.GradScaler(enabled=torch.cuda.is_available())
    
    # 5. Tracking metrics
    best_miou = 0.0
    history = {'train_loss': [], 'val_loss': [], 'val_miou': []}
    
    for epoch in range(EPOCHS):
        # --- TRAINING LOOP ---
        model.train()
        train_loss = 0.0
        
        # tqdm progress bar for visually pleasing terminal output
        progress_bar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS} [Train]")
        for images, masks in progress_bar:
            images, masks = images.to(device), masks.to(device)
            
            optimizer.zero_grad()
            
            # AMP Autocast: Runs forward pass in mixed precision
            with torch.cuda.amp.autocast(enabled=torch.cuda.is_available()):
                outputs = model(images)
                # Combine CrossEntropy with Dice Loss for better segmentation boundaries
                loss = ce_loss(outputs, masks) + dice_loss(outputs, masks)
                
            # Scale loss and backpropagate
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            
            train_loss += loss.item()
            progress_bar.set_postfix({'loss': loss.item()})
            
        avg_train_loss = train_loss / max(len(train_loader), 1)
        
        # --- VALIDATION LOOP ---
        model.eval()
        val_loss = 0.0
        val_ious = []
        
        with torch.no_grad():
            for images, masks in tqdm(val_loader, desc=f"Epoch {epoch+1}/{EPOCHS} [Val]"):
                images, masks = images.to(device), masks.to(device)
                
                with torch.cuda.amp.autocast(enabled=torch.cuda.is_available()):
                    outputs = model(images)
                    loss = ce_loss(outputs, masks) + dice_loss(outputs, masks)
                
                val_loss += loss.item()
                
                # Calculate Metrics
                preds = torch.argmax(outputs, dim=1)
                _, batch_miou = compute_iou(preds, masks, NUM_CLASSES)
                val_ious.append(batch_miou)
                
        avg_val_loss = val_loss / max(len(val_loader), 1)
        avg_val_miou = sum(val_ious) / max(len(val_ious), 1)
        
        print(f"Epoch [{epoch+1}/{EPOCHS}] - Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f} | Val mIoU: {avg_val_miou:.4f}")
        
        # Update learning rate
        scheduler.step()
        
        # Track history for plotting
        history['train_loss'].append(avg_train_loss)
        history['val_loss'].append(avg_val_loss)
        history['val_miou'].append(avg_val_miou)
        
        # Save best model
        if avg_val_miou > best_miou:
            best_miou = avg_val_miou
            print(f"New best model found! Saving to {SAVE_PATH}...")
            torch.save(model.state_dict(), SAVE_PATH)
            
    # Generate training plots for the hackathon presentation
    plot_training_curves(history['train_loss'], history['val_loss'], history['val_miou'])
    print("Training Complete. Training curves saved to training_curves.png.")

if __name__ == "__main__":
    train()
