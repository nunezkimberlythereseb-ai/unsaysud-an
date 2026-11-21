import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Store, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  Megaphone, 
  Plus, 
  Edit3, 
  Camera, 
  Trash2, 
  Check, 
  X,
  Upload,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  TrendingUp,
  Users,
  UtensilsCrossed,
  BarChart3,
  Clock,
  KeyRound,
  ShieldCheck,
  User,
  Radio,
  Archive,
  RotateCcw,
  ShieldAlert,
  Save,
  History,
  Undo2,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { SmartSalesTracker } from './SmartSalesTracker';
import { SubscriptionPaywall } from './SubscriptionPaywall';
import { 
  DishItem, 
  TranslationDictionary, 
  FoodCategory, 
  StallOwnerAccount, 
  StallAnalyticsData,
  ViewsByDayItem,
  PopularItemData,
  RecentActivityItem,
  UserSubscription,
  PaymentRecord
} from '../types';
import { getCategoryIcon } from './FoodCard';
import { getDishDisplayImage } from '../utils/imageHelper';
import { compressImageFile, validateImageFile } from '../utils/imageCompressor';
import { 
  fetchStallAnalyticsAPI, 
  updateProfileAPI, 
  saveItemPhotoAPI, 
  updateMenuItemAPI, 
  addMenuItemAPI,
  fetchStallPhotoVaultAPI,
  deleteMenuItemSafelyAPI,
  restoreArchivedDishAPI,
  saveMenuBatchAPI,
  fetchMenuVersionsAPI,
  restoreMenuVersionAPI,
  fetchSubscriptionStatusAPI
} from '../services/api';
import { MenuVersionSnapshot } from '../types';
import { getAccurateRepresentativeImage } from '../utils/representativeMapper';

interface MerchantDashboardProps {
  stallName: string;
  items: DishItem[];
  stallNotice: string;
  onSaveNotice: (notice: string) => void;
  onToggleStock: (id: number) => void;
  onUpdatePrice: (id: number, delta: number) => void;
  onAddItem?: (item: Omit<DishItem, 'id' | 'clicks'>) => void;
  onUpdateItem?: (id: number, updates: Partial<DishItem>) => void;
  onToggleHideItem?: (id: number) => void;
  onDeleteItem?: (id: number, deleteImagePermanently?: boolean) => Promise<boolean>;
  onRestoreItem?: (archiveId: string) => Promise<boolean>;
  onBatchSaved?: (items: DishItem[]) => void;
  onLogout: () => void;
  ownerProfile?: StallOwnerAccount | null;
  onUpdateOwnerProfile?: (updated: StallOwnerAccount) => void;
  t: TranslationDictionary;
}

const CATEGORIES: FoodCategory[] = [
  'Rice Meals',
  'Snacks',
  'Drinks',
  'Desserts',
  'Street Food',
  'Bread & Pastries',
  'Dumplings',
  'Fruits',
  'Other'
];

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  stallName,
  items,
  stallNotice,
  onSaveNotice,
  onToggleStock,
  onUpdatePrice,
  onAddItem,
  onUpdateItem,
  onToggleHideItem,
  onDeleteItem,
  onRestoreItem,
  onBatchSaved,
  onLogout,
  ownerProfile,
  onUpdateOwnerProfile,
  t
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'salesTracker' | 'analytics' | 'promos' | 'vault' | 'account' | 'subscription'>('menu');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'soldout' | 'hidden'>('all');
  const [noticeText, setNoticeText] = useState(stallNotice);
  const [savedNotice, setSavedNotice] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Subscription & Paywall State
  const [stallSubscription, setStallSubscription] = useState<UserSubscription | null>(null);
  const [trialStatusLabel, setTrialStatusLabel] = useState<string>('Not Started');
  const [trialEndDate, setTrialEndDate] = useState<string | null>(null);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState<boolean>(false);
  const [subscriptionDaysRemaining, setSubscriptionDaysRemaining] = useState<number>(0);
  const [isStallSuspended, setIsStallSuspended] = useState<boolean>(false);
  const [suspensionReason, setSuspensionReason] = useState<string>('');
  const [pendingPaymentInfo, setPendingPaymentInfo] = useState<PaymentRecord | null>(null);

  const checkSubscriptionStatus = async () => {
    try {
      const res = await fetchSubscriptionStatusAPI(stallName);
      setTrialStatusLabel(res.trialStatus || 'Not Started');
      setTrialEndDate(res.trialEndDate || null);
      setIsStallSuspended(Boolean(res.stallSuspended));
      setSuspensionReason(res.suspensionReason || '');
      if (res.hasSubscription && res.subscription) {
        setStallSubscription(res.subscription);
        const expired = !!res.isExpired;
        setIsSubscriptionExpired(expired);
        setSubscriptionDaysRemaining(res.daysRemaining || 0);
      } else {
        setStallSubscription(null);
        setIsSubscriptionExpired(Boolean(res.isExpired));
        setSubscriptionDaysRemaining(res.daysRemaining || 0);
      }
      setPendingPaymentInfo(res.pendingPayment || null);
    } catch (err) {
      console.warn('Subscription check error:', err);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
    const interval = setInterval(checkSubscriptionStatus, 10000);
    return () => clearInterval(interval);
  }, [stallName]);

  // Photo Vault & Archiving State
  const [photoVaultData, setPhotoVaultData] = useState<{
    protectedImages: any[];
    archivedDishes: any[];
  }>({ protectedImages: [], archivedDishes: [] });
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);

  // Safe Deletion Confirmation Modal State
  const [itemToDelete, setItemToDelete] = useState<DishItem | null>(null);
  const [deletePermanentlyChecked, setDeletePermanentlyChecked] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Load photo vault data
  const loadPhotoVault = async () => {
    setIsLoadingVault(true);
    setVaultError(null);
    try {
      const res = await fetchStallPhotoVaultAPI(stallName);
      if (res.success) {
        setPhotoVaultData({
          protectedImages: res.protectedImages || [],
          archivedDishes: res.archivedDishes || []
        });
      } else {
        setVaultError(res.error || 'Failed to load photo vault.');
      }
    } catch {
      setVaultError('Network error loading photo vault.');
    } finally {
      setIsLoadingVault(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'vault') {
      loadPhotoVault();
    }
  }, [activeTab, stallName]);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      if (onDeleteItem) {
        await onDeleteItem(itemToDelete.id, deletePermanentlyChecked);
      } else {
        await deleteMenuItemSafelyAPI(itemToDelete.id, stallName, deletePermanentlyChecked);
      }
      triggerToast(
        deletePermanentlyChecked
          ? `Deleted ${itemToDelete.name} and image permanently.`
          : `Safely removed ${itemToDelete.name}. Uploaded photo preserved in Vault.`
      );
      setItemToDelete(null);
      setDeletePermanentlyChecked(false);
      if (editingDish?.id === itemToDelete.id) {
        setEditingDish(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete menu item');
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleRestoreArchived = async (archiveId: string) => {
    try {
      if (onRestoreItem) {
        await onRestoreItem(archiveId);
      } else {
        await restoreArchivedDishAPI(archiveId, stallName);
      }
      triggerToast('Dish and original protected photo restored to active menu!');
      loadPhotoVault();
    } catch (err: any) {
      alert(err.message || 'Failed to restore dish');
    }
  };

  // Analytics State
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | '7days' | '30days'>('7days');
  const [analyticsData, setAnalyticsData] = useState<StallAnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Account Settings State
  const [editOwnerName, setEditOwnerName] = useState(ownerProfile?.ownerName || '');
  const [editContactInfo, setEditContactInfo] = useState(ownerProfile?.contactInfo || '');
  const [editStallDescription, setEditStallDescription] = useState(ownerProfile?.description || '');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);

  useEffect(() => {
    if (ownerProfile) {
      setEditOwnerName(ownerProfile.ownerName || '');
      setEditContactInfo(ownerProfile.contactInfo || '');
      setEditStallDescription(ownerProfile.description || '');
    }
  }, [ownerProfile]);

  // Modal State: Adding New Menu Item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newPrice, setNewPrice] = useState<string>('50');
  const [newCategory, setNewCategory] = useState<FoodCategory>('Rice Meals');
  const [newAvailability, setNewAvailability] = useState<boolean>(true);
  const [newDescription, setNewDescription] = useState('');
  const [newPhotoDataUrl, setNewPhotoDataUrl] = useState<string | null>(null);
  const [newPhotoInfo, setNewPhotoInfo] = useState<string | null>(null);
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [isCompressingNew, setIsCompressingNew] = useState(false);
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [savingNewStatusText, setSavingNewStatusText] = useState<string | null>(null);
  const addFileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal State: Editing Existing Menu Item
  const [editingDish, setEditingDish] = useState<DishItem | null>(null);
  const [editFoodName, setEditFoodName] = useState('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editCategory, setEditCategory] = useState<FoodCategory>('Rice Meals');
  const [editAvailability, setEditAvailability] = useState<boolean>(true);
  const [editDescription, setEditDescription] = useState('');
  const [editOriginalPhotoUrl, setEditOriginalPhotoUrl] = useState<string | null>(null);
  const [editPhotoDataUrl, setEditPhotoDataUrl] = useState<string | null>(null);
  const [isPhotoReplaced, setIsPhotoReplaced] = useState(false);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);
  const [editPhotoInfo, setEditPhotoInfo] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isCompressingEdit, setIsCompressingEdit] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [savingStatusText, setSavingStatusText] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // STRICT STALL ACCESS CONTROL & DRAFT WORKSPACE ARCHITECTURE
  // Stall owner can ONLY manage items belonging strictly to their authenticated stallName.
  const [savedItems, setSavedItems] = useState<DishItem[]>(() => {
    return items.filter(i => i.stall === stallName);
  });

  const [draftItems, setDraftItems] = useState<DishItem[]>(() => {
    return items.filter(i => i.stall === stallName);
  });

  const [undoStack, setUndoStack] = useState<DishItem[][]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([]);

  // Version History Modal State
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versionList, setVersionList] = useState<MenuVersionSnapshot[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isRestoringVersion, setIsRestoringVersion] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // Calculate unsaved changes compared to permanently saved database state
  const hasUnsavedChanges = useMemo(() => {
    if (deletedItemIds.length > 0) return true;
    if (draftItems.length !== savedItems.length) return true;
    for (let i = 0; i < draftItems.length; i++) {
      const draft = draftItems[i];
      const saved = savedItems.find(s => s.id === draft.id);
      if (!saved) return true;
      if (
        draft.name !== saved.name ||
        draft.price !== saved.price ||
        draft.category !== saved.category ||
        draft.available !== saved.available ||
        draft.items !== saved.items ||
        draft.imageUrl !== saved.imageUrl ||
        draft.ownerUploadedImage !== saved.ownerUploadedImage ||
        draft.hidden !== saved.hidden
      ) {
        return true;
      }
    }
    return false;
  }, [draftItems, savedItems, deletedItemIds]);

  // Sync savedItems when external props update if no active unsaved modifications exist
  useEffect(() => {
    const currentStallItems = items.filter(i => i.stall === stallName);
    if (!hasUnsavedChanges) {
      setSavedItems(currentStallItems);
      setDraftItems(currentStallItems);
    }
  }, [items, stallName, hasUnsavedChanges]);

  const unsavedCount = useMemo(() => {
    let count = deletedItemIds.length;
    for (const draft of draftItems) {
      const saved = savedItems.find(s => s.id === draft.id);
      if (!saved) {
        count++;
      } else if (
        draft.name !== saved.name ||
        draft.price !== saved.price ||
        draft.category !== saved.category ||
        draft.available !== saved.available ||
        draft.items !== saved.items ||
        draft.imageUrl !== saved.imageUrl ||
        draft.ownerUploadedImage !== saved.ownerUploadedImage ||
        draft.hidden !== saved.hidden
      ) {
        count++;
      }
    }
    return count;
  }, [draftItems, savedItems, deletedItemIds]);

  const isItemModified = (dish: DishItem): 'saved' | 'modified' | 'new' => {
    const saved = savedItems.find(s => s.id === dish.id);
    if (!saved) return 'new';
    if (
      dish.name !== saved.name ||
      dish.price !== saved.price ||
      dish.category !== saved.category ||
      dish.available !== saved.available ||
      dish.items !== saved.items ||
      dish.imageUrl !== saved.imageUrl ||
      dish.ownerUploadedImage !== saved.ownerUploadedImage ||
      dish.hidden !== saved.hidden
    ) {
      return 'modified';
    }
    return 'saved';
  };

  const pushToUndo = (currentList: DishItem[]) => {
    setUndoStack(prev => {
      const next = [...prev, JSON.parse(JSON.stringify(currentList))];
      if (next.length > 25) return next.slice(-25);
      return next;
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setDraftItems(previous);
    triggerToast('Undid last change.');
  };

  const handleDiscardChanges = () => {
    if (!hasUnsavedChanges) return;
    if (window.confirm('Discard all unsaved edits and revert back to the last saved version from permanent database?')) {
      setDraftItems(JSON.parse(JSON.stringify(savedItems)));
      setDeletedItemIds([]);
      setUndoStack([]);
      triggerToast('All unsaved changes discarded.');
    }
  };

  const handleSaveChanges = async () => {
    setIsSavingBatch(true);
    try {
      const res = await saveMenuBatchAPI(stallName, draftItems, deletedItemIds);
      if (res.success && res.items) {
        setSavedItems(res.items);
        setDraftItems(res.items);
        setDeletedItemIds([]);
        setUndoStack([]);
        if (onBatchSaved) {
          onBatchSaved(res.items);
        }
        triggerToast("Changes saved successfully.");
      } else {
        alert(res.error || "Failed to save changes. Please try again.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save changes. Please try again.");
    } finally {
      setIsSavingBatch(false);
    }
  };

  const loadVersionHistory = async () => {
    setIsLoadingVersions(true);
    try {
      const res = await fetchMenuVersionsAPI(stallName);
      if (res.success && res.versions) {
        setVersionList(res.versions);
      }
    } catch {
      console.warn("Could not load versions");
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!window.confirm("Restore this saved version? All owner-uploaded photos will be preserved.")) {
      return;
    }
    setIsRestoringVersion(true);
    try {
      const res = await restoreMenuVersionAPI(stallName, versionId);
      if (res.success && res.items) {
        setSavedItems(res.items);
        setDraftItems(res.items);
        setDeletedItemIds([]);
        setUndoStack([]);
        if (onBatchSaved) {
          onBatchSaved(res.items);
        }
        setIsVersionModalOpen(false);
        triggerToast("Version restored successfully.");
      } else {
        alert(res.error || "Failed to restore version.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to restore version.");
    } finally {
      setIsRestoringVersion(false);
    }
  };

  // Quick In-line Actions for Table & Cards
  const handleQuickToggleStock = (dishId: number) => {
    pushToUndo(draftItems);
    setDraftItems(prev => prev.map(item => {
      if (item.id === dishId) {
        const nextAvail = !item.available;
        triggerToast(`${item.name} marked as ${nextAvail ? 'Available' : 'Sold Out'}. Click "Save Changes" to permanently save.`);
        return { ...item, available: nextAvail };
      }
      return item;
    }));
  };

  const handleQuickPriceDelta = (dishId: number, delta: number) => {
    pushToUndo(draftItems);
    setDraftItems(prev => prev.map(item => {
      if (item.id === dishId) {
        const nextPrice = Math.max(5, item.price + delta);
        triggerToast(`Adjusted ${item.name} price to ₱${nextPrice}. Click "Save Changes" to permanently save.`);
        return { ...item, price: nextPrice };
      }
      return item;
    }));
  };

  const stallItems = draftItems;
  const activeItemsCount = stallItems.filter(i => i.available && !i.hidden).length;
  const soldOutItemsCount = stallItems.filter(i => !i.available && !i.hidden).length;
  const hiddenItemsCount = stallItems.filter(i => i.hidden).length;

  const filteredItems = stallItems.filter(i => {
    if (stockFilter === 'available') return i.available && !i.hidden;
    if (stockFilter === 'soldout') return !i.available && !i.hidden;
    if (stockFilter === 'hidden') return i.hidden;
    return true;
  });

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Fetch real analytics from backend
  const loadAnalytics = async (period = analyticsPeriod) => {
    setIsLoadingAnalytics(true);
    const data = await fetchStallAnalyticsAPI(stallName, period);
    if (data) {
      setAnalyticsData(data);
    }
    setIsLoadingAnalytics(false);
  };

  useEffect(() => {
    loadAnalytics(analyticsPeriod);
  }, [stallName, analyticsPeriod]);

  // Periodic live analytics refresh every 15 seconds when on analytics tab
  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const interval = setInterval(() => {
      loadAnalytics(analyticsPeriod);
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab, analyticsPeriod, stallName]);

  // Photo Upload Handler for New Item
  const handleNewFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAddFormError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAddFormError(validation.error || 'Please upload a JPG, JPEG, PNG, or WEBP image.');
      if (addFileInputRef.current) addFileInputRef.current.value = '';
      return;
    }

    try {
      setIsCompressingNew(true);
      const res = await compressImageFile(file);
      setNewPhotoDataUrl(res.dataUrl);
      setNewPhotoInfo(`${res.width}×${res.height} • ${res.compressedSizeKB} KB optimized`);
    } catch (err: any) {
      setAddFormError(err.message || 'Error processing photo.');
    } finally {
      setIsCompressingNew(false);
      if (addFileInputRef.current) addFileInputRef.current.value = '';
    }
  };

  // Photo Upload Handler for Editing Item
  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditFormError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setEditFormError(validation.error || 'Please upload a JPG, JPEG, PNG, or WEBP image.');
      if (editFileInputRef.current) editFileInputRef.current.value = '';
      return;
    }

    try {
      setIsCompressingEdit(true);
      const res = await compressImageFile(file);
      setEditPhotoDataUrl(res.dataUrl);
      setIsPhotoReplaced(true);
      setIsPhotoRemoved(false);
      setEditPhotoInfo(`New photo selected: ${res.width}×${res.height} • ${res.compressedSizeKB} KB optimized`);
    } catch (err: any) {
      setEditFormError(err.message || 'Error processing photo. Your previous photo was kept.');
    } finally {
      setIsCompressingEdit(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  // Remove photo action in Edit Modal
  const handleRemoveEditPhoto = () => {
    setEditPhotoDataUrl(null);
    setIsPhotoRemoved(true);
    setIsPhotoReplaced(false);
    setEditPhotoInfo('Photo marked for removal. Click Save Changes to confirm.');
  };

  // Revert back to currently saved photo
  const handleRevertToOriginalPhoto = () => {
    setEditPhotoDataUrl(editOriginalPhotoUrl);
    setIsPhotoReplaced(false);
    setIsPhotoRemoved(false);
    setEditPhotoInfo(editOriginalPhotoUrl ? 'Current saved food photo' : null);
    setEditFormError(null);
  };

  // Open Edit Modal
  const openEditModal = (dish: DishItem) => {
    setEditingDish(dish);
    setEditFoodName(dish.name);
    setEditPrice(dish.price.toString());
    setEditCategory(dish.category);
    setEditAvailability(dish.available);
    setEditDescription(dish.items);

    const displayInfo = getDishDisplayImage(dish);
    const hasOwnerPhoto = displayInfo.isOwnerUploaded && Boolean(displayInfo.url);
    const hasRepPhoto = displayInfo.isRepresentative && Boolean(displayInfo.url);

    setEditOriginalPhotoUrl(hasOwnerPhoto ? displayInfo.url! : null);
    setEditPhotoDataUrl(displayInfo.url || null);
    setIsPhotoReplaced(false);
    setIsPhotoRemoved(false);

    if (hasOwnerPhoto) {
      setEditPhotoInfo('Official stall photo uploaded by you');
    } else if (hasRepPhoto) {
      setEditPhotoInfo('Representative photo preview (Upload your own stall photo anytime)');
    } else {
      setEditPhotoInfo(null);
    }

    setEditFormError(null);
    setIsSavingEdit(false);
    setSavingStatusText(null);
  };

  // Save Edit Item (Strict Transaction per Requirements 1, 3, 4, 8, 9)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;

    const trimmedName = editFoodName.trim();
    if (!trimmedName) {
      setEditFormError('Food name cannot be empty.');
      return;
    }

    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setEditFormError('Price must be a valid positive number.');
      return;
    }

    // Check duplicate name in same stall (excluding current dish)
    const duplicate = stallItems.find(
      i => i.id !== editingDish.id && i.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setEditFormError(`A menu item named "${trimmedName}" already exists in your stall.`);
      return;
    }

    setIsSavingEdit(true);
    setEditFormError(null);

    let finalOwnerUploadedImage = editingDish.ownerUploadedImage;
    let finalImageUrl = editingDish.imageUrl;
    let photoSaveMessage: string | null = null;

    try {
      // 1. Photo Transaction if replaced or removed
      if (isPhotoReplaced && editPhotoDataUrl) {
        setSavingStatusText('Uploading photo...');
        const photoResult = await saveItemPhotoAPI(editingDish.id, stallName, editPhotoDataUrl, false);
        if (!photoResult.success || !photoResult.imageUrl) {
          setIsSavingEdit(false);
          setSavingStatusText(null);
          // Requirement 8: If image upload fails: “Photo upload failed. Your previous photo was kept.”
          // If database update fails: “We couldn't save the new photo. Please try again.”
          const errText = photoResult.error || '';
          if (errText.toLowerCase().includes('database') || errText.toLowerCase().includes("couldn't save")) {
            setEditFormError("We couldn't save the new photo. Please try again.");
          } else {
            setEditFormError("Photo upload failed. Your previous photo was kept.");
          }
          return;
        }
        finalOwnerUploadedImage = photoResult.imageUrl;
        finalImageUrl = photoResult.imageUrl;
        photoSaveMessage = 'Photo saved successfully!';
      } else if (isPhotoRemoved) {
        setSavingStatusText('Removing photo...');
        const removeResult = await saveItemPhotoAPI(editingDish.id, stallName, null, true);
        if (!removeResult.success) {
          setIsSavingEdit(false);
          setSavingStatusText(null);
          setEditFormError("We couldn't save the changes. Please try again.");
          return;
        }
        finalOwnerUploadedImage = undefined;
        finalImageUrl = editingDish.representativeImage || undefined;
        photoSaveMessage = 'Uploaded photo removed. Reverted to representative photo preview.';
      }

      // 2. Save other menu item fields to backend database
      setSavingStatusText('Saving item details...');
      const updateResult = await updateMenuItemAPI(editingDish.id, stallName, {
        name: trimmedName,
        price: parsedPrice,
        category: editCategory,
        available: editAvailability,
        items: editDescription.trim() || trimmedName,
        ownerUploadedImage: finalOwnerUploadedImage,
        representativeImage: editingDish.representativeImage,
        imageUrl: finalImageUrl
      });

      if (!updateResult.success) {
        setIsSavingEdit(false);
        setSavingStatusText(null);
        setEditFormError("We couldn't save the changes. Please try again.");
        return;
      }

      const updatedDish = updateResult.item || {
        ...editingDish,
        name: trimmedName,
        price: parsedPrice,
        category: editCategory,
        available: editAvailability,
        items: editDescription.trim() || trimmedName,
        ownerUploadedImage: finalOwnerUploadedImage,
        representativeImage: editingDish.representativeImage,
        imageUrl: finalImageUrl
      };

      // 3. Update React state everywhere in student app & owner portal
      if (onUpdateItem) {
        onUpdateItem(editingDish.id, updatedDish);
      }

      setIsSavingEdit(false);
      setSavingStatusText(null);
      setEditingDish(null);
      triggerToast("Changes saved successfully.");
    } catch (err: any) {
      setIsSavingEdit(false);
      setSavingStatusText(null);
      setEditFormError(err.message || "We couldn't save the changes. Please try again.");
    }
  };

  // Submit New Item with persistent photo storage
  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = newFoodName.trim();
    if (!trimmedName) {
      setAddFormError('Food name cannot be empty.');
      return;
    }

    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setAddFormError('Price must be a valid positive number.');
      return;
    }

    // Prevent duplicate menu item in the same stall
    const duplicate = stallItems.find(
      i => i.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setAddFormError(`A menu item named "${trimmedName}" already exists in your stall.`);
      return;
    }

    const isInsideStall = stallName.toLowerCase().includes('inside') || parseInt(stallName.replace(/\D/g, '')) >= 10;

    setIsSavingNew(true);
    setSavingNewStatusText(newPhotoDataUrl ? 'Uploading photo...' : 'Adding menu item...');
    setAddFormError(null);

    try {
      const addResult = await addMenuItemAPI(stallName, {
        name: trimmedName,
        items: newDescription.trim() || trimmedName,
        price: parsedPrice,
        rating: 4.8,
        stall: stallName,
        zone: isInsideStall ? 'inside' : 'outside',
        category: newCategory,
        tags: ['Budget', newCategory],
        available: newAvailability,
        cal: '380 kcal',
        imageUrl: newPhotoDataUrl || undefined
      });

      if (!addResult.success || !addResult.item) {
        setIsSavingNew(false);
        setSavingNewStatusText(null);
        setAddFormError(addResult.error || "Failed to create menu item. Please try again.");
        return;
      }

      if (onAddItem) {
        onAddItem(addResult.item);
      }

      setIsSavingNew(false);
      setSavingNewStatusText(null);
      setNewFoodName('');
      setNewPrice('50');
      setNewDescription('');
      setNewPhotoDataUrl(null);
      setNewPhotoInfo(null);
      setAddFormError(null);
      setIsAddModalOpen(false);
      triggerToast("Changes saved successfully.");
    } catch (err: any) {
      setIsSavingNew(false);
      setSavingNewStatusText(null);
      setAddFormError(err.message || "Failed to create menu item. Please try again.");
    }
  };

  const handleSaveNoticeSubmit = () => {
    onSaveNotice(noticeText);
    setSavedNotice(true);
    triggerToast('Announcement updated successfully.');
    setTimeout(() => setSavedNotice(false), 2000);
  };

  // Handle Account Settings Update
  const handleAccountUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);

    if (!currentPinInput) {
      setAccountError('Please enter your current PIN to authorize account changes.');
      return;
    }

    if (newPasswordInput && newPasswordInput !== confirmPasswordInput) {
      setAccountError('New passwords do not match.');
      return;
    }

    if (newPinInput && newPinInput !== confirmPinInput) {
      setAccountError('New PINs do not match.');
      return;
    }

    setIsUpdatingAccount(true);
    const result = await updateProfileAPI({
      stallName,
      currentPin: currentPinInput,
      newOwnerName: editOwnerName,
      contactInfo: editContactInfo,
      description: editStallDescription,
      newPassword: newPasswordInput || undefined,
      newPin: newPinInput || undefined
    });

    setIsUpdatingAccount(false);
    if (result.success && result.owner) {
      if (onUpdateOwnerProfile) {
        onUpdateOwnerProfile(result.owner);
      }
      triggerToast('Account settings updated successfully.');
      setCurrentPinInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    } else {
      setAccountError(result.error || 'Failed to update account settings.');
    }
  };

  const stallNoDisplay = stallName.split('—')[0]?.trim() || 'Stall';
  const stallNameDisplay = stallName.includes('—') ? stallName.split('—')[1]?.trim() : stallName;
  const ownerGreetingName = ownerProfile?.ownerName || 'Stall Owner';

  // Find max views for chart scaling
  const maxDayViews = Math.max(...(analyticsData?.viewsByDay?.map(d => d.views) || [1]), 1);

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto animate-fade-in">
      
      {/* Toast Confirmation */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500/50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* 1. STALL OWNER DASHBOARD Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-orange-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-stone-800 relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>STALL OWNER DASHBOARD</span>
            </div>
            
            <p className="text-xs sm:text-sm font-semibold text-orange-200">
              Welcome, <strong className="text-white">{ownerGreetingName}</strong>!
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-orange-600/90 text-white border border-orange-400/40">
                {stallNoDisplay}
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-display">
                {stallNameDisplay}
              </h1>
            </div>

            <p className="text-xs text-stone-300/80">
              Only you have permission to manage this stall's live menu, food photos, and prices.
            </p>
          </div>

          <button
            id="merchant-logout-btn"
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-rose-600 active:scale-95 text-xs font-black text-white transition backdrop-blur-sm self-start sm:self-center shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t.logoutMerchant}</span>
          </button>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-5 border-t border-white/10 mt-6 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-xl font-black transition active:scale-95 flex items-center gap-1.5 ${
              activeTab === 'menu'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-stone-300'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>My Stall → Menu Management</span>
            <span className="bg-white/20 px-1.5 py-0.2 rounded-md text-[10px] ml-1">
              {stallItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('salesTracker')}
            className={`px-4 py-2 rounded-xl font-black transition active:scale-95 flex items-center gap-1.5 ${
              activeTab === 'salesTracker'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-stone-300'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
            <span>Smart Sales Tracker</span>
            <span className="bg-amber-400 text-stone-900 text-[10px] px-1.5 py-0.2 rounded-md font-black">
              New
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl font-black transition active:scale-95 flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-stone-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Stall Visitor Analytics</span>
            {analyticsData && analyticsData.todayViews > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {analyticsData.todayViews} today
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('promos')}
            className={`px-4 py-2 rounded-xl font-black transition active:scale-95 flex items-center gap-1.5 ${
              activeTab === 'promos'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-stone-300'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Broadcasts & Promos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2 rounded-xl font-black transition active:scale-95 flex items-center gap-1.5 ${
              activeTab === 'vault'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-stone-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
            <span>Photo Vault & Restores</span>
            {photoVaultData.protectedImages.length > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {photoVaultData.protectedImages.length} protected
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-xl font-black transition active:scale-95 flex items-center gap-1.5 ${
              activeTab === 'account'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-stone-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Account Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2 rounded-xl font-black transition active:scale-95 flex items-center gap-1.5 ${
              activeTab === 'subscription'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white/10 hover:bg-white/20 text-stone-300'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-orange-300" />
            <span>Subscription & Billing</span>
          </button>
        </div>

      </div>

      {/* 2. STALL PERFORMANCE SUMMARY (Requirement #15: Real counters, NO fake data) */}
      <div className="bg-white rounded-3xl p-5 border border-orange-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-100/80 px-2.5 py-0.5 rounded-md">
              Today's Overview
            </span>
            <h2 className="text-sm sm:text-base font-black text-stone-900 font-display">
              Your Stall Today
            </h2>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">
            Based on actual student campus activity
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-[#FFFDF9] rounded-2xl border border-orange-100/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
              <span>Stall Views</span>
              <Eye className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-stone-900 font-display">
              {analyticsData ? analyticsData.todayViews : 0}
            </p>
            <span className="text-[10px] text-stone-600 block">
              Profile views today
            </span>
          </div>

          <div className="p-3.5 bg-[#FFFDF9] rounded-2xl border border-orange-100/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
              <span>Unique Visitors</span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-stone-900 font-display">
              {analyticsData ? analyticsData.uniqueVisitorsToday : 0}
            </p>
            <span className="text-[10px] text-stone-600 block">
              Unique students today
            </span>
          </div>

          <div className="p-3.5 bg-[#FFFDF9] rounded-2xl border border-orange-100/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
              <span>Items Viewed</span>
              <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-stone-900 font-display">
              {analyticsData ? analyticsData.menuItemViewsCount : 0}
            </p>
            <span className="text-[10px] text-stone-600 block">
              Viand details checked
            </span>
          </div>

          <div className="p-3.5 bg-[#FFFDF9] rounded-2xl border border-orange-100/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
              <span>Most Viewed</span>
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-xs sm:text-sm font-black text-stone-900 font-display truncate" title={analyticsData?.mostViewedItem || 'No activity yet'}>
              {analyticsData?.mostViewedItem || 'No activity yet'}
            </p>
            <span className="text-[10px] text-stone-600 block">
              Highest student interest
            </span>
          </div>
        </div>

        {/* Subscription, Menu Counts & Suspension Status Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 pt-1">
          <div className="lg:col-span-2 p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
                Subscription & Visibility Status
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                    isStallSuspended
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : isSubscriptionExpired
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : trialStatusLabel === 'Subscribed'
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {isStallSuspended
                    ? 'Suspended'
                    : isSubscriptionExpired
                    ? 'Expired (Menu Hidden)'
                    : trialStatusLabel}
                </span>
                {pendingPaymentInfo && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Pending Verification
                  </span>
                )}
              </div>
              <div className="text-[11px] text-stone-600 flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums pt-0.5">
                {trialEndDate && (
                  <span>
                    Trial Exp: <strong>{new Date(trialEndDate).toLocaleDateString()}</strong>
                  </span>
                )}
                {stallSubscription?.expirationDate && (
                  <span>
                    Plan Exp: <strong>{new Date(stallSubscription.expirationDate).toLocaleDateString()}</strong> ({subscriptionDaysRemaining}d left)
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('subscription')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-xs font-black text-stone-800 hover:text-orange-700 transition shrink-0 self-start sm:self-center"
            >
              Manage Billing →
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between tabular-nums">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
                Total Menu Items
              </span>
              <span className="text-xl font-black text-stone-900 font-display">{stallItems.length}</span>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <div className="text-emerald-700 font-bold">{activeItemsCount} Available</div>
              <div className="text-rose-700 font-bold">{soldOutItemsCount} Sold Out</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 block">
                Smart Sales Tracker
              </span>
              <span className="text-xs font-bold text-stone-700">Log closing & itemized profit</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('salesTracker')}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl transition shrink-0"
            >
              Open
            </button>
          </div>
        </div>

        {(isStallSuspended || isSubscriptionExpired) && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="block font-black">
                {isStallSuspended
                  ? 'Stall Suspended — Menu Hidden From Customers'
                  : 'Subscription Expired — Menu Temporarily Hidden From Customers'}
              </strong>
              <span className="text-[11px]">
                {isStallSuspended
                  ? suspensionReason || 'Contact the platform administrator for restoration details.'
                  : 'Your stall records and saved photos remain intact. Submit a subscription renewal to restore customer visibility.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('subscription')}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shrink-0 self-start sm:self-center"
            >
              Open Subscription & Billing
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MENU MANAGEMENT                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          
          {/* PERMANENT SAVE & VERSIONING CONTROL BAR (Requirements #1, #2) */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-100/80 px-2.5 py-0.5 rounded-md">
                    Menu Controls & Persistence
                  </span>
                  {hasUnsavedChanges ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black border border-amber-300">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>{unsavedCount} Unsaved Change{unsavedCount > 1 ? 's' : ''}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>All Changes Saved to Permanent Database</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500">
                  {hasUnsavedChanges
                    ? 'You have unsaved changes in this session. Click "Save Changes" to permanently store all dishes, prices, categories, and photos to campus database.'
                    : 'Your stall menu is permanently saved. All updates remain intact after page refresh, logout, or browser restart.'}
                </p>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                {/* Clear Save Changes Button */}
                <button
                  id="merchant-save-changes-btn"
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSavingBatch}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 shadow-sm active:scale-95 ${
                    hasUnsavedChanges
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50 shadow-emerald-600/20'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                  }`}
                  title="Permanently save all menu changes to persistent storage"
                >
                  {isSavingBatch ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes {hasUnsavedChanges ? `(${unsavedCount})` : ''}</span>
                    </>
                  )}
                </button>

                {/* Undo Unsaved Changes Button */}
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 border border-stone-200 active:scale-95"
                  title="Undo last unsaved edit"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo</span>
                  {undoStack.length > 0 && (
                    <span className="bg-stone-200 text-stone-800 text-[10px] px-1.5 py-0.2 rounded-md font-black">
                      {undoStack.length}
                    </span>
                  )}
                </button>

                {/* Discard Unsaved Changes Button */}
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  disabled={!hasUnsavedChanges}
                  className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 border border-stone-200 active:scale-95"
                  title="Discard all unsaved edits and restore last saved state"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Discard</span>
                </button>

                {/* Restore / Version History Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsVersionModalOpen(true);
                    loadVersionHistory();
                  }}
                  className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-stone-700 transition flex items-center gap-1.5 border border-stone-200 active:scale-95"
                  title="View saved menu versions and restore a previous snapshot"
                >
                  <History className="w-3.5 h-3.5 text-stone-500" />
                  <span>Version History</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Bar: Add Item + Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs">
            <div>
              <h2 className="text-base font-black text-stone-900 font-display">
                Menu Management
              </h2>
              <p className="text-xs text-stone-500">
                Manage food photos, actual prices, categories, and live availability for {stallName}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddFormError(null);
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Menu Item</span>
              </button>

              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    stockFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All ({stallItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('available')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    stockFilter === 'available' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Available ({activeItemsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('soldout')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    stockFilter === 'soldout' ? 'bg-white text-rose-800 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Sold Out ({soldOutItemsCount})</span>
                </button>
                {hiddenItemsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStockFilter('hidden')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                      stockFilter === 'hidden' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <EyeOff className="w-3 h-3 text-stone-400" />
                    <span>Hidden ({hiddenItemsCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table / List */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center text-xs text-stone-500">
              No items in this category filter.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs">
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="bg-[#FFFDF9] border-b border-stone-200 text-[11px] font-black uppercase tracking-wider text-stone-400">
                    <tr>
                      <th className="py-3.5 px-4">Photo</th>
                      <th className="py-3.5 px-4">Food Name</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Availability</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredItems.map((dish) => (
                      <tr 
                        key={dish.id} 
                        className={`hover:bg-orange-50/30 transition ${
                          dish.hidden ? 'bg-stone-50/70 opacity-60' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          {(() => {
                            const displayImage = getDishDisplayImage(dish);
                            return (
                              <div className="relative w-14 h-11 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                                {displayImage.url ? (
                                  <>
                                    <img
                                      src={displayImage.url}
                                      alt={dish.name}
                                      className="w-full h-full object-cover"
                                    />
                                    {displayImage.isRepresentative && (
                                      <span className="absolute bottom-0 inset-x-0 bg-stone-900/80 text-[8px] font-black text-amber-300 text-center py-0.2 uppercase tracking-tight">
                                        Rep
                                      </span>
                                    )}
                                    {displayImage.isOwnerUploaded && (
                                      <span className="absolute bottom-0 inset-x-0 bg-emerald-900/80 text-[8px] font-black text-emerald-200 text-center py-0.2 uppercase tracking-tight">
                                        Owner
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-[9px] text-stone-400 leading-tight p-1 text-center">
                                    <Camera className="w-3.5 h-3.5 text-stone-300 mb-0.5" />
                                    <span>No photo</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="font-black text-stone-900 font-display block text-sm">
                              {dish.name}
                            </span>
                            <span className="text-[11px] text-stone-500 line-clamp-1 max-w-xs">
                              {dish.items}
                            </span>
                            {dish.hidden && (
                              <span className="inline-block text-[10px] font-bold text-stone-500 bg-stone-200 px-1.5 py-0.2 rounded">
                                Hidden from Students
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-base font-black text-stone-900 font-display">
                            ₱{dish.price}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 font-bold text-[11px]">
                            {getCategoryIcon(dish.category, "w-3 h-3 text-orange-600")}
                            <span>{dish.category}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-1 rounded-full border ${
                              dish.available
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${dish.available ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{dish.available ? 'Available' : 'Sold Out'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(dish)}
                              className="px-2.5 py-1.5 bg-white border border-stone-200 hover:border-orange-300 hover:bg-orange-50 text-stone-700 hover:text-orange-700 font-bold rounded-lg transition flex items-center gap-1 shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onToggleStock(dish.id);
                                triggerToast(`${dish.name} marked as ${dish.available ? 'Sold Out' : 'Available'}`);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg font-bold transition text-[11px] border ${
                                dish.available
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {dish.available ? 'Sold Out' : 'Available'}
                            </button>

                            {onToggleHideItem && (
                              <button
                                type="button"
                                onClick={() => {
                                  onToggleHideItem(dish.id);
                                  triggerToast(`${dish.name} ${dish.hidden ? 'restored' : 'hidden'}`);
                                }}
                                className={`p-1.5 rounded-lg border transition ${
                                  dish.hidden
                                    ? 'bg-stone-200 text-stone-800 border-stone-300'
                                    : 'bg-white text-stone-400 hover:text-stone-700 border-stone-200 hover:bg-stone-50'
                                }`}
                                title={dish.hidden ? 'Unhide item for students' : 'Hide item from students'}
                              >
                                {dish.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete(dish);
                                setDeletePermanentlyChecked(false);
                              }}
                              className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition"
                              title="Safely delete menu item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-stone-100">
                {filteredItems.map((dish) => (
                  <div key={dish.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {(() => {
                        const displayImage = getDishDisplayImage(dish);
                        return (
                          <div className="relative w-16 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                            {displayImage.url ? (
                              <>
                                <img
                                  src={displayImage.url}
                                  alt={dish.name}
                                  className="w-full h-full object-cover"
                                />
                                {displayImage.isRepresentative && (
                                  <span className="absolute bottom-0 inset-x-0 bg-stone-900/80 text-[8px] font-black text-amber-300 text-center py-0.2 uppercase tracking-tight">
                                    Rep
                                  </span>
                                )}
                                {displayImage.isOwnerUploaded && (
                                  <span className="absolute bottom-0 inset-x-0 bg-emerald-900/80 text-[8px] font-black text-emerald-200 text-center py-0.2 uppercase tracking-tight">
                                    Owner
                                  </span>
                                )}
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-[9px] text-stone-400 leading-tight p-1 text-center">
                                <Camera className="w-4 h-4 text-stone-300 mb-0.5" />
                                <span>No photo</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-black text-stone-900 font-display text-sm truncate">
                            {dish.name}
                          </h4>
                          <span className="text-base font-black text-stone-900 font-display">
                            ₱{dish.price}
                          </span>
                        </div>

                        <p className="text-xs text-stone-500 line-clamp-1">
                          {dish.items}
                        </p>

                        <div className="flex items-center gap-2 pt-1 text-[11px]">
                          <span className="text-stone-600 font-semibold">{dish.category}</span>
                          <span>•</span>
                          <span className={`font-bold ${dish.available ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {dish.available ? '● Available' : '● Sold Out'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(dish)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-stone-700 font-bold rounded-lg transition flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {onToggleHideItem && (
                          <button
                            type="button"
                            onClick={() => {
                              onToggleHideItem(dish.id);
                              triggerToast(`${dish.name} ${dish.hidden ? 'restored' : 'hidden'}`);
                            }}
                            className="px-2.5 py-1.5 bg-stone-100 text-stone-600 font-bold rounded-lg transition"
                          >
                            {dish.hidden ? 'Unhide' : 'Hide'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete(dish);
                            setDeletePermanentlyChecked(false);
                          }}
                          className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-rose-600 transition"
                          title="Safely delete menu item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onToggleStock(dish.id);
                          triggerToast(`${dish.name} marked as ${dish.available ? 'Sold Out' : 'Available'}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition text-xs border ${
                          dish.available
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {dish.available ? 'Mark Sold Out' : 'Mark Available'}
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: SMART SALES TRACKER                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'salesTracker' && (
        <SmartSalesTracker
          stallName={stallName}
          menuItems={stallItems}
          onTriggerToast={triggerToast}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STALL VISITOR ANALYTICS                                            */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Analytics Header Controls */}
          <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Live Activity (Auto-refreshes)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 font-display mt-0.5">
                Stall Visitor Analytics
              </h2>
              <p className="text-xs text-stone-500">
                Track authentic student interest, profile views, and popular menu items without personal tracking.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Period Selector Tabs: Today | 7 Days | 30 Days */}
              <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold text-stone-600">
                <button
                  type="button"
                  onClick={() => setAnalyticsPeriod('today')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    analyticsPeriod === 'today' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'hover:text-stone-900'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsPeriod('7days')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    analyticsPeriod === '7days' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'hover:text-stone-900'
                  }`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsPeriod('30days')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    analyticsPeriod === '30days' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'hover:text-stone-900'
                  }`}
                >
                  30 Days
                </button>
              </div>

              <button
                type="button"
                onClick={() => loadAnalytics(analyticsPeriod)}
                disabled={isLoadingAnalytics}
                className="p-2 rounded-xl bg-stone-100 hover:bg-orange-50 text-stone-600 hover:text-orange-600 border border-stone-200 transition"
                title="Refresh analytics data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-3xl border border-orange-100 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Total Stall Views
              </span>
              <p className="text-2xl font-black text-stone-900 font-display">
                {analyticsData?.totalViews ?? 0}
              </p>
              <span className="text-[10px] text-stone-600">
                {analyticsData?.todayViews ?? 0} today
              </span>
            </div>

            <div className="p-4 bg-white rounded-3xl border border-orange-100 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Views This Week
              </span>
              <p className="text-2xl font-black text-stone-900 font-display">
                {analyticsData?.thisWeekViews ?? 0}
              </p>
              <span className="text-[10px] text-stone-600">
                Last 7 days
              </span>
            </div>

            <div className="p-4 bg-white rounded-3xl border border-orange-100 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Views This Month
              </span>
              <p className="text-2xl font-black text-stone-900 font-display">
                {analyticsData?.thisMonthViews ?? 0}
              </p>
              <span className="text-[10px] text-stone-600">
                Last 30 days
              </span>
            </div>

            <div className="p-4 bg-white rounded-3xl border border-orange-100 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                Unique Visitors Today
              </span>
              <p className="text-2xl font-black text-emerald-700 font-display">
                {analyticsData?.uniqueVisitorsToday ?? 0}
              </p>
              <span className="text-[10px] text-stone-600">
                Privacy-safe sessions
              </span>
            </div>
          </div>

          {/* Clean Views by Day Chart */}
          <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-stone-900 font-display">
                  Stall Views by Day
                </h3>
                <p className="text-xs text-stone-500">
                  Visual activity breakdown for {analyticsPeriod === 'today' ? 'Today' : analyticsPeriod === '7days' ? 'the past 7 days' : 'the past 30 days'}.
                </p>
              </div>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-xl">
                Actual Server Data
              </span>
            </div>

            {/* Simple Bar Chart */}
            {analyticsData?.viewsByDay && analyticsData.viewsByDay.length > 0 ? (
              <div className="pt-4 space-y-2">
                <div className="h-44 flex items-end gap-2 sm:gap-4 pb-2 border-b border-stone-200">
                  {analyticsData.viewsByDay.map((d, i) => {
                    const heightPercent = maxDayViews > 0 ? Math.max(Math.round((d.views / maxDayViews) * 100), 4) : 4;
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                        <span className="text-[10px] font-black text-stone-700 group-hover:text-orange-600 transition">
                          {d.views}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                            d.views > 0
                              ? 'bg-gradient-to-t from-orange-600 to-amber-500 group-hover:from-orange-500 group-hover:to-amber-400 shadow-2xs'
                              : 'bg-stone-200/70'
                          }`}
                        />
                        <span className="text-[9px] sm:text-[10px] text-stone-500 font-semibold truncate max-w-full text-center">
                          {d.label.split(',')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
                  <span>📅 Deduplicated campus visitors</span>
                  <span>Max daily views: <strong>{maxDayViews}</strong></span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl">
                No visitor activity yet. Real views will appear when students open your stall profile.
              </div>
            )}
          </div>

          {/* Two-Column Grid: Popular Menu Items & Recent Visitor Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Popular Menu Items (Requirement #12: Real data only, or 'No activity yet') */}
            <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-stone-900 font-display flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <span>Popular Menu Items</span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Dishes students inspect most frequently.
                  </p>
                </div>
              </div>

              {analyticsData?.popularItems && analyticsData.popularItems.length > 0 ? (
                <div className="space-y-2">
                  {analyticsData.popularItems.slice(0, 7).map((item, idx) => (
                    <div 
                      key={item.dishId}
                      className="p-3 bg-stone-50/80 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-black text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-stone-900 truncate">
                          {item.dishName}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 font-black text-stone-800 text-[11px] shrink-0">
                        {item.views} {item.views === 1 ? 'view' : 'views'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <UtensilsCrossed className="w-6 h-6 text-stone-300 mx-auto mb-1.5" />
                  <span className="font-semibold block">No activity yet</span>
                  <span className="text-[11px] text-stone-600">Dishes will be ranked when students open their details.</span>
                </div>
              )}
            </div>

            {/* 2. Recent Visitor Activity (Requirement #11: Privacy-safe Anonymous Visitor events) */}
            <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-stone-900 font-display flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Recent Stall Activity</span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Real-time anonymous campus browsing events.
                  </p>
                </div>
              </div>

              {analyticsData?.recentActivity && analyticsData.recentActivity.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {analyticsData.recentActivity.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-[#FFFDF9] rounded-2xl border border-orange-100/90 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium text-stone-800 truncate">
                          {event.description}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-stone-600 shrink-0">
                        {event.timeAgo}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <Clock className="w-6 h-6 text-stone-300 mx-auto mb-1.5" />
                  <span className="font-semibold block">No visitor activity yet</span>
                  <span className="text-[11px] text-stone-600">Recent campus visitor events will be recorded here.</span>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PROMOTIONS & ANNOUNCEMENTS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'promos' && (
        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-stone-900 font-display flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-orange-600" />
              <span>Broadcast Notice & Promotions</span>
            </h3>
            <p className="text-xs text-stone-500">
              Create an announcement or special promo displayed directly on your stall's cards for students.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-stone-800">
              Today's Announcement Message:
            </label>
            <input
              id="stall-broadcast-notice-input"
              type="text"
              value={noticeText}
              onChange={(e) => setNoticeText(e.target.value)}
              placeholder="e.g., Hot batch ready! Free soup with any rice meal."
              className="w-full bg-stone-50 border border-stone-200 text-xs sm:text-sm px-4 py-3 rounded-xl font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
            />
          </div>

          {/* Quick Promo Presets */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Quick Promo Templates:
            </span>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => setNoticeText('Fresh hot batch cooked! Free soup included.')}
                className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold border border-orange-200 transition"
              >
                🍲 Fresh Batch & Free Soup
              </button>
              <button
                type="button"
                onClick={() => setNoticeText('Special Student Combo Meal today! Save ₱5.')}
                className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold border border-orange-200 transition"
              >
                ⚡ Special Combo Deal
              </button>
              <button
                type="button"
                onClick={() => setNoticeText('Chili garlic oil and calamansi freshly prepared!')}
                className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold border border-orange-200 transition"
              >
                🌶️ Fresh Chili Garlic
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <button
              id="save-notice-btn"
              onClick={handleSaveNoticeSubmit}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <span>{savedNotice ? 'Saved & Broadcasted!' : 'Save & Publish Promo'}</span>
            </button>

            {noticeText && (
              <button
                type="button"
                onClick={() => {
                  setNoticeText('');
                  onSaveNotice('');
                }}
                className="px-4 py-2.5 text-stone-500 hover:text-stone-800 font-bold text-xs"
              >
                Clear Promo
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ACCOUNT MANAGEMENT & SECURITY SETTINGS (Requirements #3, #6, #19)  */}
      {/* ========================================================================= */}
      {activeTab === 'account' && (
        <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-orange-100 shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-base sm:text-lg font-black text-stone-900 font-display flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
              <span>Stall Owner Profile & Account Settings</span>
            </h3>
            <p className="text-xs text-stone-500">
              Manage your owner profile, change your password, and update your security PIN.
            </p>
          </div>

          {accountError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{accountError}</span>
            </div>
          )}

          {/* Assigned Stall Info (Locked - Cannot be re-assigned by owner) */}
          <div className="p-4 bg-[#FFFDF9] rounded-2xl border border-orange-100 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block">
              Assigned Cafeteria Stall
            </span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm sm:text-base font-black text-stone-900 font-display block">
                  {stallName}
                </span>
                <span className="text-xs text-stone-500">
                  USTP CDO Campus Cafeteria
                </span>
              </div>
              <span className="px-2.5 py-1 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-lg border border-stone-200">
                🔒 Locked to Your Account
              </span>
            </div>
          </div>

          <form onSubmit={handleAccountUpdateSubmit} className="space-y-4 text-xs">
            {/* Owner Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Owner / Manager Name
                </label>
                <input
                  type="text"
                  required
                  value={editOwnerName}
                  onChange={(e) => setEditOwnerName(e.target.value)}
                  placeholder="Your name"
                  className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Contact Information
                </label>
                <input
                  type="text"
                  value={editContactInfo}
                  onChange={(e) => setEditContactInfo(e.target.value)}
                  placeholder="Mobile number or Messenger"
                  className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-black text-stone-800 mb-1">
                Stall Description & Specialty
              </label>
              <textarea
                rows={2}
                value={editStallDescription}
                onChange={(e) => setEditStallDescription(e.target.value)}
                placeholder="Describe your stall specialties for campus customers"
                className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
              />
            </div>

            {/* Username / Email (Readonly) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  disabled
                  value={ownerProfile?.username || stallNoDisplay.toLowerCase().replace(/\s+/g, '')}
                  className="w-full text-xs sm:text-sm p-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Registered Email
                </label>
                <input
                  type="text"
                  disabled
                  value={ownerProfile?.email || 'owner@ustp.cafeteria.ph'}
                  className="w-full text-xs sm:text-sm p-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-500"
                />
              </div>
            </div>

            <div className="border-t border-stone-100 pt-4 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
                Change Password (Optional)
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-4 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
                Change Security PIN (Optional)
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    New 4–6 Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="e.g. 5678"
                    className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Confirm New PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="Confirm PIN"
                    className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Authorize with Current PIN */}
            <div className="border-t border-stone-100 pt-4 bg-orange-50/70 p-4 rounded-2xl border border-orange-200">
              <label className="block font-black text-stone-900 mb-1">
                Enter Current Security PIN to Authorize Changes *
              </label>
              <input
                type="password"
                required
                maxLength={6}
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter current security PIN"
                className="w-full text-xs p-3 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono tracking-widest text-stone-900"
              />
              <span className="text-[11px] text-stone-500 pt-1 block">
                Your PIN is never exposed and authorizes sensitive account updates.
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 font-bold transition flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Log Out of Stall</span>
              </button>

              <button
                type="submit"
                disabled={isUpdatingAccount}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                {isUpdatingAccount ? (
                  <span>Saving Changes...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Account Settings</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: SUBSCRIPTION & BILLING                                               */}
      {/* ========================================================================= */}
      {activeTab === 'subscription' && (
        <div className="space-y-4 animate-fade-in">
          <SubscriptionPaywall
            stallName={stallName}
            onNavigate={() => {}}
            onRefreshStatus={checkSubscriptionStatus}
            showBackToPortal={false}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PHOTO VAULT & ARCHIVES (Non-Negotiable Image Protection & Restores) */}
      {/* ========================================================================= */}
      {activeTab === 'vault' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 rounded-3xl p-6 sm:p-8 text-white border border-amber-900/40 relative overflow-hidden shadow-lg">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>NON-NEGOTIABLE PERMANENT IMAGE PROTECTION</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white">
                Stall Owner Photo Vault & Dish Archives
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                All food photos you upload and save are strictly treated as <strong>permanent user data</strong>. 
                They will NEVER be deleted, replaced, disconnected, or overwritten automatically by any future prompt, menu update, code change, UI refresh, or application version.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={loadPhotoVault}
                disabled={isLoadingVault}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVault ? 'animate-spin' : ''}`} />
                <span>{isLoadingVault ? 'Verifying Storage...' : 'Re-verify Photo Vault'}</span>
              </button>
            </div>
          </div>

          {/* Policy Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1">
              <span className="font-black text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Highest Display Priority</span>
              </span>
              <p className="text-stone-500 text-[11px]">
                Owner-uploaded photos ALWAYS take absolute priority and are never overridden by demo pictures.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1">
              <span className="font-black text-amber-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Safe Menu Deletion</span>
              </span>
              <p className="text-stone-500 text-[11px]">
                Deleting a dish removes it from student view but preserves the uploaded image in your vault.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1">
              <span className="font-black text-blue-800 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <span>1-Click Dish Recovery</span>
              </span>
              <p className="text-stone-500 text-[11px]">
                Archived items and their original photography can be restored directly to your menu anytime.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1">
              <span className="font-black text-purple-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-purple-600" />
                <span>Dual Persistent Storage</span>
              </span>
              <p className="text-stone-500 text-[11px]">
                Stored simultaneously in disk storage registry and persistent browser image vault.
              </p>
            </div>
          </div>

          {/* SECTION A: Protected Images Gallery */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-black text-stone-900 font-display flex items-center gap-2">
                  <Camera className="w-4 h-4 text-orange-600" />
                  <span>Protected Food Photos for {stallName}</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {photoVaultData.protectedImages.length} official owner photo(s) safeguarded in disk storage
                </p>
              </div>
            </div>

            {isLoadingVault ? (
              <div className="py-12 text-center text-xs text-stone-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                <span>Loading protected photo vault...</span>
              </div>
            ) : photoVaultData.protectedImages.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-stone-200 rounded-2xl p-6">
                <Camera className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-bold text-stone-700">No owner photos registered yet for this stall</p>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                  When you edit a menu item and upload a food photo, it will automatically register and be permanently protected here.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('menu')}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition"
                >
                  Go to Menu Management
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photoVaultData.protectedImages.map((img) => (
                  <div
                    key={img.imageId}
                    className="group bg-stone-50/70 rounded-2xl border border-stone-200 overflow-hidden hover:border-amber-400 transition shadow-2xs space-y-2"
                  >
                    <div className="relative aspect-[4/3] bg-stone-200 overflow-hidden">
                      <img
                        src={img.persistentImageUrl}
                        alt={img.dishName}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-2 left-2 bg-emerald-900/90 text-emerald-200 text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">
                        🛡️ PROTECTED
                      </span>
                      <span className={`absolute bottom-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded shadow ${
                        img.active ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-200'
                      }`}>
                        {img.active ? '● Active on Menu' : '● Preserved in Vault'}
                      </span>
                    </div>

                    <div className="p-3 space-y-1 text-xs">
                      <span className="font-black text-stone-900 block truncate text-sm">
                        {img.dishName}
                      </span>
                      <div className="text-[10px] text-stone-500 space-y-0.5 font-mono">
                        <div className="truncate" title={img.imageId}>
                          ID: <span className="text-stone-700">{img.imageId}</span>
                        </div>
                        <div className="truncate" title={img.storageId}>
                          File: <span className="text-stone-700">{img.storageId}</span>
                        </div>
                        <div>
                          Uploaded: {new Date(img.uploadTimestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION B: Archived Dishes & 1-Click Restore */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-black text-stone-900 font-display flex items-center gap-2">
                  <Archive className="w-4 h-4 text-orange-600" />
                  <span>Archived Menu Items & Instant Restore</span>
                </h3>
                <p className="text-xs text-stone-500">
                  {photoVaultData.archivedDishes.length} archived dish(es). You can restore any item and its photo back to the live menu at any time.
                </p>
              </div>
            </div>

            {photoVaultData.archivedDishes.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                <span>No dishes are currently archived. When you safely delete an item, it will appear here for recovery.</span>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {photoVaultData.archivedDishes.map((arch: any) => (
                  <div key={arch.archiveId} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {arch.dish?.imageUrl ? (
                          <img src={arch.dish.imageUrl} alt={arch.dish.name} className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-4 h-4 text-stone-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-stone-900 block truncate text-sm">
                          {arch.dish?.name}
                        </span>
                        <div className="text-[11px] text-stone-500 flex items-center gap-2">
                          <span className="font-bold text-orange-700">₱{arch.dish?.price}</span>
                          <span>•</span>
                          <span>{arch.dish?.category}</span>
                          <span>•</span>
                          <span>Archived {new Date(arch.archivedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestoreArchived(arch.archiveId)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition flex items-center gap-1.5 shrink-0 active:scale-95 shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore to Menu</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW MENU ITEM                                                */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 font-display">
                    Add New Menu Item
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Adding to: <strong className="text-stone-700">{stallName}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Food / Menu Name *
                </label>
                <input
                  type="text"
                  required
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  placeholder="e.g. Chicken Teriyaki"
                  className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-stone-800 mb-1">
                    Price (₱) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="45"
                    className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-black text-stone-800 mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as FoodCategory)}
                    className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Availability State *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAvailability(true)}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                      newAvailability
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Available</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewAvailability(false)}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                      !newAvailability
                        ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Sold Out</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Food Photo (Recommended)
                </label>
                <p className="text-[11px] text-stone-400 mb-2">
                  Supports JPG, JPEG, PNG, WEBP. Automatically resized and optimized.
                </p>

                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center">
                  {newPhotoDataUrl ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={newPhotoDataUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => addFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white text-stone-800 rounded-lg text-xs font-bold hover:bg-stone-100"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewPhotoDataUrl(null);
                            setNewPhotoInfo(null);
                          }}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
                        >
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 space-y-2">
                      <Camera className="w-8 h-8 text-stone-400 mx-auto" strokeWidth={1.5} />
                      <div className="text-stone-500">
                        <span className="font-semibold block">No photo selected</span>
                        <span className="text-[11px] text-stone-400">Shows "No photo available" placeholder</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addFileInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-white border border-stone-300 text-stone-700 hover:border-orange-400 hover:text-orange-700 rounded-xl font-bold transition shadow-2xs inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                  )}
                </div>

                {newPhotoInfo && (
                  <p className="text-[11px] text-emerald-700 font-medium pt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{newPhotoInfo}</span>
                  </p>
                )}

                <input
                  ref={addFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleNewFileChange}
                />
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Ingredients / Item Description (Optional)
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. 1 cup rice, grilled chicken patty, teriyaki glaze"
                  className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompressingNew || isSavingNew}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSavingNew ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{savingNewStatusText || 'Adding Item...'}</span>
                    </>
                  ) : isCompressingNew ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Optimizing Photo...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Menu Item</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT EXISTING MENU ITEM                                          */}
      {/* ========================================================================= */}
      {editingDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 font-display">
                    Edit Menu Item
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Stall: <strong className="text-stone-700">{editingDish.stall}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Food / Menu Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFoodName}
                  onChange={(e) => setEditFoodName(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-stone-800 mb-1">
                    Price (₱) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-black text-orange-600"
                  />
                </div>

                <div>
                  <label className="block font-black text-stone-800 mb-1">
                    Category *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as FoodCategory)}
                    className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Availability State *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditAvailability(true)}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                      editAvailability
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Available</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditAvailability(false)}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition ${
                      !editAvailability
                        ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Sold Out</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-black text-stone-800 text-xs">
                    Food Photo Management
                  </label>
                  {isPhotoReplaced && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                      New Photo Preview (Unsaved)
                    </span>
                  )}
                  {!isPhotoReplaced && editOriginalPhotoUrl && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                      Official Stall Photo
                    </span>
                  )}
                  {!isPhotoReplaced && !editOriginalPhotoUrl && editPhotoDataUrl && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                      Representative Photo Preview
                    </span>
                  )}
                  {isPhotoRemoved && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                      Stall Photo Removed (Using Representative Preview)
                    </span>
                  )}
                </div>
                
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center shadow-inner">
                  {editPhotoDataUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={editPhotoDataUrl}
                        alt="Food photo preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 z-10">
                        {isPhotoReplaced ? (
                          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-md shadow-xs">
                            NEW PHOTO PREVIEW
                          </span>
                        ) : editOriginalPhotoUrl ? (
                          <span className="text-[10px] font-black bg-emerald-700 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                            OFFICIAL STALL PHOTO
                          </span>
                        ) : (
                          <span className="text-[10px] font-black bg-stone-900/80 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                            REPRESENTATIVE PHOTO
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 space-y-1 text-stone-400">
                      <Camera className="w-8 h-8 text-stone-300 mx-auto" strokeWidth={1.5} />
                      <span className="text-xs font-bold block text-stone-500">
                        No photo available
                      </span>
                      <span className="text-[11px] text-stone-400">
                        Clean neutral placeholder will be shown everywhere to students
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2.5">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={isSavingEdit || isCompressingEdit}
                    className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition flex items-center justify-center gap-1.5 border border-orange-700 text-xs active:scale-95 disabled:opacity-60 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{editOriginalPhotoUrl ? 'Change Stall Photo' : 'Upload Stall Photo'}</span>
                  </button>

                  {isPhotoReplaced && editOriginalPhotoUrl && (
                    <button
                      type="button"
                      onClick={handleRevertToOriginalPhoto}
                      disabled={isSavingEdit}
                      className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition flex items-center justify-center gap-1 border border-stone-200 text-xs active:scale-95 disabled:opacity-60"
                      title="Keep previous photo"
                    >
                      <span>Keep Current Photo</span>
                    </button>
                  )}

                  {editOriginalPhotoUrl && !isPhotoRemoved && (
                    <button
                      type="button"
                      onClick={handleRemoveEditPhoto}
                      disabled={isSavingEdit}
                      className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition flex items-center justify-center gap-1 border border-rose-200 text-xs active:scale-95 disabled:opacity-60"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Stall Photo</span>
                    </button>
                  )}
                </div>

                {editPhotoInfo && (
                  <p className="text-[11px] text-emerald-700 font-medium pt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{editPhotoInfo}</span>
                  </p>
                )}

                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleEditFileChange}
                />
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Ingredients / Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    if (editingDish) {
                      setItemToDelete(editingDish);
                      setDeletePermanentlyChecked(false);
                    }
                  }}
                  disabled={isSavingEdit}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border border-rose-200 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Item</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDish(null)}
                    disabled={isSavingEdit}
                    className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold transition disabled:opacity-60 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCompressingEdit || isSavingEdit}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-60 text-xs"
                  >
                    {isSavingEdit ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{savingStatusText || 'Saving Changes...'}</span>
                      </>
                    ) : isCompressingEdit ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Optimizing Photo...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SAFE MENU ITEM DELETION CONFIRMATION                             */}
      {/* ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 font-display">
                  Safe Menu Deletion
                </h3>
                <p className="text-xs text-stone-500">
                  Safely remove item from active student menu
                </p>
              </div>
            </div>

            {/* Dish Summary */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3">
              {(() => {
                const imgInfo = getDishDisplayImage(itemToDelete);
                return (
                  <div className="w-14 h-12 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {imgInfo.url ? (
                      <img src={imgInfo.url} alt={itemToDelete.name} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-4 h-4 text-stone-300" />
                    )}
                  </div>
                );
              })()}
              <div className="min-w-0">
                <span className="font-black text-stone-900 block truncate text-sm">
                  {itemToDelete.name}
                </span>
                <span className="text-xs text-stone-500">
                  ₱{itemToDelete.price} • {itemToDelete.category}
                </span>
              </div>
            </div>

            {/* Safe Image Protection Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="font-black flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Image Protection Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                By default, any uploaded photo is <strong>safely preserved</strong> in your Stall Photo Vault. 
                You can restore this dish or reconnect the image at any time.
              </p>
            </div>

            {/* Explicit Permanent Delete Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={deletePermanentlyChecked}
                onChange={(e) => setDeletePermanentlyChecked(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <div className="space-y-0.5">
                <span className="font-black text-stone-900 block">
                  Delete Image Permanently (Irreversible)
                </span>
                <span className="text-[11px] text-stone-500 block leading-tight">
                  Only check this if you explicitly want to erase the uploaded photo file from disk storage.
                </span>
              </div>
            </label>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setItemToDelete(null);
                  setDeletePermanentlyChecked(false);
                }}
                disabled={isDeletingItem}
                className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold transition text-xs disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingItem}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl transition text-xs shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingItem ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: VERSION HISTORY & RESTORES                                       */}
      {/* ========================================================================= */}
      {isVersionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 font-display">
                    Saved Menu Version History
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Stall: <strong className="text-stone-700">{stallName}</strong> • Restore any previous saved state
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsVersionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanatory Notice */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
              <p className="font-bold text-stone-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Non-Destructive Version Restore Guarantee</span>
              </p>
              <p className="text-[11px] text-stone-500">
                Restoring a previous saved version will revert menu item names, prices, categories, and availability to that point in time. 
                Any owner-uploaded photos are permanently preserved in your Stall Vault.
              </p>
            </div>

            {/* Versions List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoadingVersions ? (
                <div className="py-12 text-center text-xs text-stone-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                  <p>Loading saved menu versions from campus database...</p>
                </div>
              ) : versionList.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500 space-y-2">
                  <History className="w-8 h-8 mx-auto text-stone-300" />
                  <p className="font-bold text-stone-700">No version snapshots recorded yet</p>
                  <p className="text-stone-400 text-[11px]">
                    A new version snapshot is automatically recorded each time you click "Save Changes".
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versionList.map((ver, idx) => (
                    <div 
                      key={ver.versionId}
                      className="p-4 rounded-2xl border border-stone-200 bg-[#FFFDF9] hover:border-orange-200 transition space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-stone-900 font-display">
                              {idx === 0 ? 'Latest Saved Snapshot' : `Version Snapshot #${versionList.length - idx}`}
                            </span>
                            {idx === 0 && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.2 rounded-md">
                                Current Active
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {new Date(ver.timestamp).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-xl">
                            {ver.itemCount} menu items
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(ver.versionId)}
                            disabled={isRestoringVersion}
                            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-60"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore This Version</span>
                          </button>
                        </div>
                      </div>

                      {/* Items Preview Chips */}
                      {ver.items && ver.items.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {ver.items.slice(0, 6).map((dish) => (
                            <span 
                              key={dish.id}
                              className="text-[10px] font-semibold bg-white border border-stone-200 text-stone-700 px-2 py-0.5 rounded-lg truncate max-w-[140px]"
                            >
                              {dish.name} (₱{dish.price})
                            </span>
                          ))}
                          {ver.items.length > 6 && (
                            <span className="text-[10px] font-semibold bg-stone-100 text-stone-500 px-2 py-0.5 rounded-lg">
                              +{ver.items.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-stone-400">
                {versionList.length} saved version snapshot{versionList.length !== 1 ? 's' : ''} on record
              </span>
              <button
                type="button"
                onClick={() => setIsVersionModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING STICKY SAVE CHANGES BAR (Shows whenever unsaved edits exist in menu tab) */}
      {activeTab === 'menu' && hasUnsavedChanges && (
        <div className="fixed bottom-20 sm:bottom-6 inset-x-4 max-w-2xl mx-auto z-40 bg-stone-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-stone-700/80 flex flex-wrap items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div>
              <p className="text-xs font-black text-amber-300">
                {unsavedCount} Unsaved Change{unsavedCount > 1 ? 's' : ''} in Menu
              </p>
              <p className="text-[11px] text-stone-400">
                Click "Save Changes" to store permanently to database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
              title="Undo last change"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>

            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-rose-950 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
              title="Discard all changes"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSavingBatch}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
            >
              {isSavingBatch ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
