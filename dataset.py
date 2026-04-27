import os
import torch
from torch.utils.data import Dataset
from PIL import Image
import numpy as np
import torchvision.transforms.functional as TF
import random

class TerrainDataset(Dataset):
    """
    Custom Dataset for loading off-road terrain images and their corresponding segmentation masks.
    Includes data augmentation techniques crucial for generalization to unseen environments.
    """
    def __init__(self, root_dir, split='train', img_size=(256, 256)):
        self.root_dir = root_dir
        self.split = split
        self.img_size = img_size
        
        self.images_dir = os.path.join(root_dir, split, 'Color_Images')
        self.masks_dir = os.path.join(root_dir, split, 'Segmentation')
        
        if not os.path.exists(self.images_dir) or not os.path.exists(self.masks_dir):
            print(f"Warning: Data paths not found: {self.images_dir} or {self.masks_dir}")
            self.images = []
            self.masks = []
        else:
            self.images = sorted(os.listdir(self.images_dir))
            self.masks = sorted(os.listdir(self.masks_dir))
        
    def transform(self, image, mask):
        # Resize inputs to standard shape for the model
        image = TF.resize(image, self.img_size, interpolation=TF.InterpolationMode.BILINEAR)
        mask = TF.resize(mask, self.img_size, interpolation=TF.InterpolationMode.NEAREST)
        
        # --- DATA AUGMENTATION (Improves Generalization) ---
        
        # 1. Random horizontal flip (camera facing different directions)
        if random.random() > 0.5:
            image = TF.hflip(image)
            mask = TF.hflip(mask)

        # 2. Random rotation (simulates uneven terrain/camera roll)
        if random.random() > 0.5:
            angle = random.uniform(-15, 15)
            image = TF.rotate(image, angle)
            mask = TF.rotate(mask, angle, interpolation=TF.InterpolationMode.NEAREST)
        
        # 3. Brightness adjustment (simulates shadows, sun glare, overcast)
        if random.random() > 0.5:
            brightness_factor = random.uniform(0.7, 1.3)
            image = TF.adjust_brightness(image, brightness_factor)
            
        # 4. Gaussian blur (simulates motion blur or dust on lens)
        if random.random() > 0.5:
            image = TF.gaussian_blur(image, kernel_size=[3, 3])

        # Convert image to float tensor (0.0 to 1.0)
        image = TF.to_tensor(image)
        # Normalize using ImageNet statistics for the pretrained backbone
        image = TF.normalize(image, mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        
        # Convert mask to long tensor for CrossEntropyLoss
        mask = torch.as_tensor(np.array(mask), dtype=torch.long)
        
        # 5. Add Gaussian noise to image tensor (robustness against sensor noise)
        if random.random() > 0.5:
            noise = torch.randn_like(image) * 0.05
            image = image + noise
            # Clip values back roughly to normalized bounds
            image = torch.clamp(image, -2.5, 2.5)

        return image, mask
        
    def __len__(self):
        return len(self.images)
        
    def __getitem__(self, idx):
        img_name = self.images[idx]
        # Match mask to image
        mask_name = self.masks[idx] if idx < len(self.masks) else img_name.replace('.jpg', '.png')
        
        img_path = os.path.join(self.images_dir, img_name)
        mask_path = os.path.join(self.masks_dir, mask_name)
        
        image = Image.open(img_path).convert("RGB")
        mask = Image.open(mask_path).convert("L")
        
        if self.split == 'train':
            image, mask = self.transform(image, mask)
        else:
            # Deterministic transforms for validation/test (No augmentations)
            image = TF.resize(image, self.img_size, interpolation=TF.InterpolationMode.BILINEAR)
            mask = TF.resize(mask, self.img_size, interpolation=TF.InterpolationMode.NEAREST)
            image = TF.to_tensor(image)
            image = TF.normalize(image, mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            mask = torch.as_tensor(np.array(mask), dtype=torch.long)
            
        return image, mask
