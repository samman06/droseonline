# Material Edit Feature - Complete Documentation

## ✨ Feature Overview

Teachers and admins can now edit existing materials with the option to replace files while maintaining all statistics and engagement data.

## 🎯 Implementation Details

### Option 2: Simple Replace (Implemented)
- Edit material metadata (title, description, category, course, groups)
- Optionally replace the file/link
- Automatically delete old file from server when replaced
- Maintain all statistics (views, downloads, engagement)
- Clean and intuitive UI

## 📋 What Can Be Edited

### Always Editable:
1. ✅ **Title** - Update material title
2. ✅ **Description** - Modify description
3. ✅ **Category** - Change category (lecture_notes, reading, video, etc.)
4. ✅ **Course** - Reassign to different course
5. ✅ **Groups** - Update visibility (specific groups or all students)

### Read-Only:
- ❌ **Material Type** - Cannot be changed after creation (security/consistency)

### Optional:
6. ✅ **File/Link Replacement** - Replace existing file or external URL

## 🔧 Technical Implementation

### Frontend

#### 1. Material Edit Component (`material-edit.component.ts`)
**Location**: `frontend/src/app/materials/material-edit/material-edit.component.ts`

**Features**:
- Loads existing material data and populates form
- Shows current file information with icon and size
- Checkbox to enable/disable file replacement
- Drag & drop file upload for replacement
- File size validation (50MB max)
- Progress indicator during update
- Form validation

**Key Methods**:
```typescript
loadMaterial() // Fetch existing material
populateForm() // Pre-fill form with current data
onSubmit() // Handle update with optional file replacement
```

#### 2. Material Service Update (`material.service.ts`)
**Updated Method**:
```typescript
updateMaterial(id: string, material: Partial<Material> | FormData): Observable<ApiResponse<Material>>
```

**Behavior**:
- Accepts both JSON (Partial<Material>) for metadata-only updates
- Accepts FormData for updates with file replacement
- Uses HttpClient directly for FormData to handle multipart/form-data correctly
- Uses ApiService for JSON updates

#### 3. Routing Configuration (`app.routes.ts`)
**Added Route**:
```typescript
{
  path: ':id/edit',
  canActivate: [RoleGuard],
  data: { roles: ['admin', 'teacher'] },
  loadComponent: () => import('./materials/material-edit/material-edit.component').then(m => m.MaterialEditComponent)
}
```

### Backend

#### Updated PUT Endpoint (`routes/materials.js`)
**Route**: `PUT /api/materials/:id`

**Middleware**:
- `authenticate` - Verify user is logged in
- `authorize('admin', 'teacher')` - Only admins and teachers can edit
- `upload.single('file')` - Multer middleware for file upload
- Ownership check - Only owner or admin can edit

**Features**:
1. **Metadata Update**
   - Updates title, description, category, course, groups
   - Works without file replacement

2. **File Replacement** (when `replaceFile === 'true'`)
   - Accepts new file upload via multer
   - Deletes old file from disk using `fs.unlinkSync()`
   - Updates file metadata (fileUrl, fileName, fileSize, mimeType)
   - Handles both file uploads and external URL updates
   - Comprehensive logging for debugging

3. **Error Handling**
   - Validates material existence
   - Checks user ownership
   - Graceful error handling for file deletion
   - Detailed console logging

**Code Flow**:
```
1. Authenticate user
2. Find material by ID
3. Verify ownership
4. Update basic fields (title, description, etc.)
5. If replaceFile flag is true:
   a. Get old file path
   b. Upload new file via multer
   c. Delete old file from disk
   d. Update file metadata in database
6. Save material
7. Populate relationships
8. Return updated material
```

## 🎨 UI/UX Features

### Current File Display
- Blue info box showing current file
- File icon, name, and size
- Only shown if file/link exists

### Material Type Badge
- Read-only display showing material type
- Help text explaining type cannot be changed
- Gray background for disabled state

### Replace File Section
- Checkbox to enable/disable replacement
- When unchecked: Shows "Keep current file" message
- When checked:
  - For files: Drag & drop upload area
  - For links: URL input field
  - Warning message: "The current file will be permanently replaced"

### File Upload Area (when replacing)
- Drag & drop support
- Browse button
- Shows selected file with remove option
- File size display
- Max size warning (50MB)

### Progress Indicator
- Shows during update process
- Percentage display (0-100%)
- Gradient progress bar

### Validation
- Title required
- Category required
- Course required
- If replacing file: file/link required
- File size validation (50MB max)

## 📝 Usage Examples

### Example 1: Update Metadata Only
```typescript
// User updates title and description
// Does NOT check "Replace file"
// Old file remains unchanged
```

### Example 2: Replace File
```typescript
// User checks "Replace file"
// Uploads new PDF
// Old file is deleted
// New file is stored
// Statistics preserved
```

### Example 3: Change Course and Groups
```typescript
// User selects different course
// Groups dropdown updates
// Selects new groups
// Material visibility updated
```

## 🔐 Security & Permissions

### Who Can Edit?
1. **Admin** - Can edit any material
2. **Teacher** - Can only edit their own materials
3. **Student** - Cannot edit materials

### Validation Checks:
- ✅ User must be authenticated
- ✅ User must have teacher or admin role
- ✅ Material must exist
- ✅ Non-admins can only edit their own materials
- ✅ File size limits enforced (50MB)

## 🗑️ File Management

### Old File Deletion
When a file is replaced:
1. New file is uploaded via multer
2. Old file path is retrieved from database
3. Old file is deleted from disk using `fs.unlinkSync()`
4. If deletion fails, error is logged but update continues
5. Database is updated with new file info

### File Storage
- Location: `/uploads/materials/`
- Naming: `file-{timestamp}-{random}.{ext}`
- Max size: 100MB (server config)
- Max size: 50MB (client validation)

## 📊 Statistics Preservation

### Preserved Data:
- ✅ View count
- ✅ Download count
- ✅ Last accessed date
- ✅ Upload date (original)
- ✅ Uploader (original)
- ✅ Material ID
- ✅ Material code

### Updated Data:
- Title, description, category
- Course and group associations
- File URL, name, size, MIME type (if replaced)
- Updated timestamp

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Edit button visible for own materials (teacher)
- [ ] Edit button visible for all materials (admin)
- [ ] Edit button hidden for other teachers' materials
- [ ] Form loads with current data
- [ ] Current file info displayed correctly

### Metadata Updates
- [ ] Update title only
- [ ] Update description only
- [ ] Change category
- [ ] Change course
- [ ] Update groups

### File Replacement
- [ ] Replace PDF with new PDF
- [ ] Replace image with new image
- [ ] Replace document with different document
- [ ] Replace file with external link
- [ ] Replace external link with file
- [ ] Replace external link with new link

### File Deletion
- [ ] Old file deleted from disk
- [ ] No orphaned files in uploads folder
- [ ] Error handling if file doesn't exist

### Validation
- [ ] Cannot submit without title
- [ ] Cannot submit without category
- [ ] Cannot submit without course
- [ ] Cannot submit empty file when replacing
- [ ] File size validation (50MB)

### Permissions
- [ ] Teacher can edit own materials
- [ ] Teacher cannot edit other teachers' materials
- [ ] Admin can edit any material
- [ ] Student cannot access edit page

### Statistics
- [ ] View count preserved after edit
- [ ] Download count preserved after edit
- [ ] Upload date unchanged
- [ ] Uploader unchanged

### UI/UX
- [ ] Current file info displayed
- [ ] Replace checkbox works
- [ ] Drag & drop file upload
- [ ] Browse button works
- [ ] Progress indicator shows
- [ ] Success toast appears
- [ ] Error toast on failure
- [ ] Back button works
- [ ] Cancel button works

## 🚀 Future Enhancements (Optional)

### Version History
- Store previous versions of files
- Allow reverting to older versions
- Show change history timeline
- Track who made each change

### Advanced Features
- Bulk edit multiple materials
- Duplicate material
- Move material to different course
- Archive instead of delete
- Preview changes before saving
- Scheduled updates

### UI Improvements
- Side-by-side comparison (old vs new)
- File preview before replacement
- Image thumbnail comparison
- Diff view for text files

## 📚 Related Files

### Frontend
- `frontend/src/app/materials/material-edit/material-edit.component.ts` (NEW)
- `frontend/src/app/materials/material-detail/material-detail.component.ts`
- `frontend/src/app/materials/material-list/material-list.component.ts`
- `frontend/src/app/services/material.service.ts` (UPDATED)
- `frontend/src/app/app.routes.ts` (UPDATED)

### Backend
- `routes/materials.js` (UPDATED - PUT endpoint)
- `models/Material.js`
- `middleware/auth.js`

### Documentation
- `MATERIAL_EDIT_FEATURE.md` (THIS FILE)
- `SUPPORTED_FILE_TYPES.md`
- `TEXT_FILE_PREVIEW_DEMO.md`

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs for backend errors
3. Verify file permissions on uploads directory
4. Ensure user has proper role (teacher/admin)
5. Verify material ownership

## ✅ Status

**Feature Status**: ✅ **Complete and Ready to Test**

**Implemented**:
- ✅ Material edit component with form
- ✅ File replacement with checkbox toggle
- ✅ Backend PUT endpoint with file handling
- ✅ Automatic old file deletion
- ✅ Routing configuration
- ✅ Service method updates
- ✅ Comprehensive UI/UX
- ✅ Security and permission checks
- ✅ Progress indicators
- ✅ Validation and error handling

**Next Step**: Testing! 🧪

