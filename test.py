import torch
from torch.utils.data import DataLoader
from tqdm import tqdm

from models.segmentation_model import VajraDristiModel
from utils.dataset import TerrainDataset
from utils.metrics import compute_iou, compute_accuracy

# --- HYPERPARAMETERS ---
BATCH_SIZE = 8
NUM_CLASSES = 5
DATA_DIR = "../Offroad_Segmentation_Training_Dataset"
MODEL_PATH = "vajradristi_best.pth"

def test():
    """
    Evaluates the trained VajraDristi model on the test/validation dataset.
    Outputs the final Mean IoU and Pixel Accuracy.
    """
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Testing on device: {device}")
    
    # We use the 'val' split here assuming it's our holdout test set for the hackathon
    test_dataset = TerrainDataset(root_dir=DATA_DIR, split='val')
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    
    model = VajraDristiModel(num_classes=NUM_CLASSES)
    
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        print(f"Successfully loaded model weights from {MODEL_PATH}")
    except FileNotFoundError:
        print(f"Error: Could not find model weights at {MODEL_PATH}. Please run train.py first.")
        return
        
    model.to(device)
    model.eval()
    
    val_ious = []
    val_accs = []
    
    with torch.no_grad():
        for images, masks in tqdm(test_loader, desc="Evaluating"):
            images, masks = images.to(device), masks.to(device)
            
            # Forward pass
            outputs = model(images)
            preds = torch.argmax(outputs, dim=1)
            
            # Compute metrics
            _, batch_miou = compute_iou(preds, masks, NUM_CLASSES)
            batch_acc = compute_accuracy(preds, masks)
            
            val_ious.append(batch_miou)
            val_accs.append(batch_acc)
            
    final_miou = sum(val_ious) / max(len(val_ious), 1)
    final_acc = sum(val_accs) / max(len(val_accs), 1)
    
    print("\n" + "="*30)
    print("--- Final Test Results ---")
    print("="*30)
    print(f"Mean IoU:     {final_miou*100:.2f}%")
    print(f"Pixel Acc:    {final_acc*100:.2f}%")
    print("="*30)

if __name__ == "__main__":
    test()
