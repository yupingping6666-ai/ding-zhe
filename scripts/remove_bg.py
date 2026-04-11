#!/usr/bin/env python3
"""Remove cream/beige background from cat PNG images, making it transparent."""
import os
import sys
from PIL import Image
import math

def remove_background(input_path, output_path, tolerance=38):
    """Remove the cream background by sampling corner pixels and flood-filling."""
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    w, h = img.size

    # Sample background color from corners (average of 10x10 corner regions)
    corner_samples = []
    for cx, cy in [(0,0), (w-1,0), (0,h-1), (w-1,h-1)]:
        for dx in range(min(10, w)):
            for dy in range(min(10, h)):
                sx = min(max(cx + dx if cx == 0 else cx - dx, 0), w-1)
                sy = min(max(cy + dy if cy == 0 else cy - dy, 0), h-1)
                r, g, b, a = pixels[sx, sy]
                corner_samples.append((r, g, b))

    # Average background color
    avg_r = sum(s[0] for s in corner_samples) // len(corner_samples)
    avg_g = sum(s[1] for s in corner_samples) // len(corner_samples)
    avg_b = sum(s[2] for s in corner_samples) // len(corner_samples)
    bg_color = (avg_r, avg_g, avg_b)
    print(f"  Detected bg color: RGB({avg_r}, {avg_g}, {avg_b})")

    # Flood fill from all 4 edges to mark background pixels
    visited = set()
    bg_pixels = set()
    queue = []

    # Add all edge pixels as seeds
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))

    while queue:
        x, y = queue.pop()
        if (x, y) in visited:
            continue
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        visited.add((x, y))

        r, g, b, a = pixels[x, y]
        # Check if pixel is similar to background
        dist = math.sqrt((r - bg_color[0])**2 + (g - bg_color[1])**2 + (b - bg_color[2])**2)
        if dist <= tolerance:
            bg_pixels.add((x, y))
            # Add neighbors (4-connected)
            for nx, ny in [(x+1,y), (x-1,y), (x,y+1), (x,y-1)]:
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    queue.append((nx, ny))

    # Create soft edge transition
    # For pixels near the boundary, apply partial transparency
    edge_width = 2
    edge_pixels = set()
    for x, y in bg_pixels:
        for nx, ny in [(x+1,y), (x-1,y), (x,y+1), (x,y-1),
                       (x+1,y+1), (x-1,y-1), (x+1,y-1), (x-1,y+1)]:
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in bg_pixels:
                edge_pixels.add((nx, ny))

    # Apply transparency
    for x, y in bg_pixels:
        r, g, b, a = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)

    # Soften edges
    for x, y in edge_pixels:
        r, g, b, a = pixels[x, y]
        # Count how many bg neighbors
        bg_count = 0
        total = 0
        for dx in range(-edge_width, edge_width + 1):
            for dy in range(-edge_width, edge_width + 1):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    total += 1
                    if (nx, ny) in bg_pixels:
                        bg_count += 1
        ratio = bg_count / max(total, 1)
        new_alpha = int(a * (1 - ratio * 0.5))
        pixels[x, y] = (r, g, b, new_alpha)

    # Crop to content bounding box with padding
    bbox = img.getbbox()
    if bbox:
        pad = 10
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(w, bbox[2] + pad)
        bottom = min(h, bbox[3] + pad)
        img = img.crop((left, top, right, bottom))

    img.save(output_path, "PNG")
    print(f"  Saved: {output_path} ({img.size[0]}x{img.size[1]})")

def main():
    cat_dir = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "pets", "cat")
    cat_dir = os.path.abspath(cat_dir)

    # Process only the unique source images
    source_files = [
        "idle.png", "happy.png", "thinking.png", "sleeping.png",
        "eating.png", "love.png", "playing.png", "standing.png",
    ]
    # After processing source, copy to aliases
    aliases = {
        "idle.png": ["sitting.png", "angry.png", "error.png", "empty.png"],
        "sleeping.png": ["lying.png"],
        "thinking.png": ["curious.png"],
        "standing.png": ["achievement.png", "notification.png"],
    }

    for fname in source_files:
        fpath = os.path.join(cat_dir, fname)
        if os.path.exists(fpath):
            print(f"Processing {fname}...")
            remove_background(fpath, fpath, tolerance=38)
        else:
            print(f"SKIP: {fname} not found")

    # Copy aliases
    for src, dsts in aliases.items():
        src_path = os.path.join(cat_dir, src)
        if os.path.exists(src_path):
            for dst in dsts:
                dst_path = os.path.join(cat_dir, dst)
                import shutil
                shutil.copy2(src_path, dst_path)
                print(f"  Copied {src} -> {dst}")

    print("\nDone! All cat images processed.")

if __name__ == "__main__":
    main()
