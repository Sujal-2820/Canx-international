# 🖼️ Cloudinary Setup - Canx International

## ✅ Your Cloudinary Credentials

```
Cloud Name: dh1k427cx
API Key: 347177322749219
API Secret: dv0U0bF7w32GHx-xzvYgLK7nUMk
```

---

## 🚀 Setup Steps

### 1. Create Upload Presets

You need **TWO** upload presets:

#### A. For Images (Products, Categories, etc.)
1. Go to: https://cloudinary.com/console/settings/upload
2. Scroll to **"Upload presets"**
3. Click **"Add upload preset"**

**Settings:**
```
Preset name: canx-international-products
Signing mode: Unsigned ✅
Asset folder: canx-products
Allowed formats: jpg, png, webp, gif
Max file size: 10 MB
Image transformations:
  - Max width: 2000px
  - Max height: 2000px
  - Quality: Auto
  - Format: Auto
```

4. Click **"Save"**

---

#### B. For PDFs (Vendor Documents)
1. Click **"Add upload preset"** again

**Settings:**
```
Preset name: canx-international-documents
Signing mode: Unsigned ✅
Asset folder: canx-documents
Resource type: Auto ✅ (IMPORTANT for PDFs!)
Allowed formats: pdf
Max file size: 10 MB
```

**Additional Settings (scroll down):**
- **Access mode:** Public
- **Delivery type:** Upload
- **Use filename:** Yes (helps identify documents)

2. Click **"Save"**

---

### 2. Enable PDF Preview (IMPORTANT!)

Cloudinary can generate preview images of PDFs:

1. Go to **Settings** → **Upload**
2. Find **"Eager transformations"** section
3. For the `canx-international-documents` preset, add:

**Eager transformation:**
```
Format: jpg
Page: 1 (first page preview)
Width: 800
Quality: Auto
```

This creates a thumbnail of the first page!

---

### 3. Update Environment Variables

#### Backend (.env):
```env
CLOUDINARY_CLOUD_NAME=dh1k427cx
CLOUDINARY_API_KEY=347177322749219
CLOUDINARY_API_SECRET=dv0U0bF7w32GHx-xzvYgLK7nUMk
CLOUDINARY_URL=cloudinary://347177322749219:dv0U0bF7w32GHx-xzvYgLK7nUMk@dh1k427cx
```

#### Frontend (.env):
```env
VITE_CLOUDINARY_CLOUD_NAME=dh1k427cx
VITE_CLOUDINARY_API_KEY=347177322749219
VITE_CLOUDINARY_UPLOAD_PRESET=canx-international-products
VITE_CLOUDINARY_UPLOAD_PRESET_DOCUMENTS=canx-international-documents
```

---

## 📄 PDF Upload & Viewing

### How PDFs Work in Cloudinary

#### Upload URL:
```
https://api.cloudinary.com/v1_1/dh1k427cx/auto/upload
```

#### View PDF URL (after upload):
```
https://res.cloudinary.com/dh1k427cx/image/upload/canx-documents/document.pdf
```

#### PDF Preview (first page as image):
```
https://res.cloudinary.com/dh1k427cx/image/upload/pg_1,w_800,f_jpg/canx-documents/document.pdf
```

### PDF Transformations

Cloudinary supports these PDF transformations:

1. **Get specific page:**
   ```
   pg_2 - Get page 2
   ```

2. **Convert to image:**
   ```
   f_jpg - Convert to JPG
   f_png - Convert to PNG
   ```

3. **Resize:**
   ```
   w_800,h_1000 - Resize to 800x1000
   ```

4. **Quality:**
   ```
   q_auto - Auto quality
   ```

**Example:**
```
https://res.cloudinary.com/dh1k427cx/image/upload/pg_1,w_600,f_jpg,q_auto/canx-documents/vendor-license.pdf
```

---

## 🔧 Frontend Implementation

### Upload PDF (Vendor Registration)

```javascript
const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'canx-international-documents');
  formData.append('folder', 'canx-documents');
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dh1k427cx/auto/upload`,
    {
      method: 'POST',
      body: formData
    }
  );
  
  const data = await response.json();
  return data.secure_url; // Save this URL in database
};
```

### Display PDF

**Option 1: Embed PDF Viewer**
```jsx
<iframe 
  src={pdfUrl}
  width="100%"
  height="600px"
  title="Vendor Document"
/>
```

**Option 2: Show Preview + Download**
```jsx
<div>
  {/* Preview (first page as image) */}
  <img 
    src={`https://res.cloudinary.com/dh1k427cx/image/upload/pg_1,w_600,f_jpg/${publicId}.pdf`}
    alt="Document Preview"
  />
  
  {/* Download button */}
  <a href={pdfUrl} download>
    Download PDF
  </a>
</div>
```

---

## 📋 Cloudinary Dashboard Settings

### 1. Create Folders (for organization)

Go to **Media Library** → Create folders:
- `canx-products` - Product images
- `canx-documents` - Vendor PDFs
- `canx-categories` - Category images
- `canx-users` - User avatars

### 2. Security Settings

**Settings** → **Security**:

- **Allowed fetch domains:**
  - `localhost`
  - `your-vercel-domain.vercel.app`
  
- **Restricted media types:** (optional)
  - Allow: `image`, `raw` (for PDFs)

### 3. Usage Alerts

**Settings** → **Account**:
- Set alert at 80% of free tier

---

## 🧪 Test Upload

### Test Image Upload:
```bash
curl -X POST \
  https://api.cloudinary.com/v1_1/dh1k427cx/image/upload \
  -F "file=@test-image.jpg" \
  -F "upload_preset=canx-international-products"
```

### Test PDF Upload:
```bash
curl -X POST \
  https://api.cloudinary.com/v1_1/dh1k427cx/auto/upload \
  -F "file=@test-document.pdf" \
  -F "upload_preset=canx-international-documents"
```

---

## 📊 URL Patterns

### Images:
```
Original: https://res.cloudinary.com/dh1k427cx/image/upload/v1234567890/canx-products/product.jpg

Optimized: https://res.cloudinary.com/dh1k427cx/image/upload/w_500,q_auto,f_auto/v1234567890/canx-products/product.jpg
```

### PDFs:
```
Original PDF: https://res.cloudinary.com/dh1k427cx/image/upload/v1234567890/canx-documents/license.pdf

Preview (page 1): https://res.cloudinary.com/dh1k427cx/image/upload/pg_1,w_800,f_jpg/v1234567890/canx-documents/license.pdf

Download: https://res.cloudinary.com/dh1k427cx/image/upload/fl_attachment/v1234567890/canx-documents/license.pdf
```

---

## ✅ Configuration Checklist

- [ ] Created `canx-international-products` preset (unsigned)
- [ ] Created `canx-international-documents` preset (unsigned)
- [ ] Enabled PDF preview transformations
- [ ] Updated Backend `.env`
- [ ] Updated Frontend `.env`
- [ ] Created folders in Media Library
- [ ] Configured security settings
- [ ] Tested image upload
- [ ] Tested PDF upload

---

## 🔑 Environment Variables Summary

### Backend (Render):
```env
CLOUDINARY_CLOUD_NAME=dh1k427cx
CLOUDINARY_API_KEY=347177322749219
CLOUDINARY_API_SECRET=dv0U0bF7w32GHx-xzvYgLK7nUMk
CLOUDINARY_URL=cloudinary://347177322749219:dv0U0bF7w32GHx-xzvYgLK7nUMk@dh1k427cx
```

### Frontend (Vercel):
```env
VITE_CLOUDINARY_CLOUD_NAME=dh1k427cx
VITE_CLOUDINARY_API_KEY=347177322749219
VITE_CLOUDINARY_UPLOAD_PRESET=canx-international-products
VITE_CLOUDINARY_UPLOAD_PRESET_DOCUMENTS=canx-international-documents
```

---

## 💡 Pro Tips

### 1. PDF Security
Add password protection:
```
https://res.cloudinary.com/dh1k427cx/image/upload/fl_attachment:vendor-license/canx-documents/license.pdf
```

### 2. PDF Thumbnails
Generate multiple page previews:
```javascript
// Page 1
https://res.cloudinary.com/dh1k427cx/image/upload/pg_1,w_200,f_jpg/doc.pdf

// Page 2
https://res.cloudinary.com/dh1k427cx/image/upload/pg_2,w_200,f_jpg/doc.pdf
```

### 3. Watermark PDFs
Add watermark to preview:
```
https://res.cloudinary.com/dh1k427cx/image/upload/l_text:Arial_40:CONFIDENTIAL,o_30/pg_1/doc.pdf
```

---

## 🐛 Troubleshooting

### PDF not uploading
- ✅ Check preset is set to **"Auto"** resource type
- ✅ Verify PDF is under 10MB
- ✅ Check preset is **"Unsigned"**

### PDF not displaying
- ✅ Use `/auto/upload` endpoint (not `/image/upload`)
- ✅ Check URL is correct
- ✅ Verify file was uploaded successfully

### Preview not generating
- ✅ Enable eager transformations in preset
- ✅ Wait a few seconds after upload
- ✅ Check Cloudinary dashboard for errors

---

**Setup Complete!** 🎉

Your Cloudinary is now ready for:
- ✅ Product images
- ✅ Vendor PDF documents
- ✅ PDF previews
- ✅ Optimized delivery
