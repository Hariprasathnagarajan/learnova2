import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/adminService';
import type { UserListItem } from '../../types/user.types';
import { colors } from '../../theme/colors';

export interface StaffOption {
  id: number;
  name: string;
  email: string;
}

interface StaffPickerProps {
  selectedIds: (number | string)[];
  onChange: (ids: number[]) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  initialStaff?: { id: string | number; name: string; email: string }[];
}

export const StaffPicker: React.FC<StaffPickerProps> = ({
  selectedIds,
  onChange,
  label = 'Assigned To',
  description = 'Select the Staff members responsible for managing this course.',
  placeholder = 'Search and select staff...',
  initialStaff = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Normalize selected IDs into a numeric Set for fast lookup
  const numericSelectedSet = useMemo(() => {
    return new Set(
      selectedIds
        .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
        .filter((n): n is number => Number.isFinite(n))
    );
  }, [selectedIds]);

  // Combine initialStaff with fetched staffList into a unified dictionary for label resolution
  const staffDict = useMemo(() => {
    const map = new Map<number, StaffOption>();
    for (const s of initialStaff) {
      const numId = typeof s.id === 'string' ? parseInt(s.id, 10) : s.id;
      if (Number.isFinite(numId)) {
        map.set(numId, { id: numId, name: s.name, email: s.email });
      }
    }
    for (const s of staffList) {
      map.set(s.id, s);
    }
    return map;
  }, [initialStaff, staffList]);

  // Fetch staff list from backend API
  const fetchStaff = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const data: UserListItem[] = await adminService.getStaffUsers(query);
      const options: StaffOption[] = data.map((u) => {
        const numId = parseInt(u.id, 10);
        const fullName =
          `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
          u.email.split('@')[0];
        return {
          id: numId,
          name: fullName,
          email: u.email,
        };
      });
      setStaffList(options);
      setHasLoaded(true);
    } catch {
      // Keep existing list on network error
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once on initial mount or when opening
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      fetchStaff();
    }
  }, [isOpen, hasLoaded, fetchStaff]);

  // Debounce search query against API when user types
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchStaff(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, fetchStaff]);

  const handleToggleOption = (id: number) => {
    const current = Array.from(numericSelectedSet);
    if (numericSelectedSet.has(id)) {
      onChange(current.filter((item) => item !== id));
    } else {
      onChange([...current, id]);
    }
  };

  const handleRemoveChip = (id: number) => {
    const current = Array.from(numericSelectedSet);
    onChange(current.filter((item) => item !== id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Filter staff locally in case API debouncing is settling
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staffList;
    const q = searchQuery.toLowerCase();
    return staffList.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [staffList, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Header and Field Label */}
      <View style={styles.labelRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {numericSelectedSet.size > 0 && (
          <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selected Staff Chips / Tags */}
      {numericSelectedSet.size > 0 && (
        <View style={styles.chipsContainer}>
          {Array.from(numericSelectedSet).map((id) => {
            const staff = staffDict.get(id);
            const displayName = staff?.name || `Staff #${id}`;
            return (
              <View key={id} style={styles.chip}>
                <Ionicons name="person-circle-outline" size={16} color={colors.accent} style={{ marginRight: 5 }} />
                <Text style={styles.chipText} numberOfLines={1}>
                  {displayName}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveChip(id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.chipRemoveButton}
                  accessibilityLabel={`Remove ${displayName}`}
                >
                  <Ionicons name="close-circle" size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Closed State Trigger */}
      <TouchableOpacity
        style={[styles.trigger, isOpen && styles.triggerActive]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Ionicons name="people-outline" size={18} color={isOpen ? colors.accent : colors.text.muted} />
        <Text style={[styles.triggerText, numericSelectedSet.size > 0 && { color: colors.text.primary }]}>
          {numericSelectedSet.size === 0
            ? placeholder
            : `${numericSelectedSet.size} staff member${numericSelectedSet.size > 1 ? 's' : ''} assigned`}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.text.secondary}
        />
      </TouchableOpacity>

      {/* Opened State Dropdown Panel */}
      {isOpen && (
        <View style={styles.dropdownPanel}>
          {/* Search Input */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color={colors.text.muted} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search staff by name or email"
              placeholderTextColor={colors.text.muted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.text.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Results List */}
          <View style={styles.resultsContainer}>
            {loading && staffList.length === 0 ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator color={colors.accent} size="small" />
                <Text style={styles.stateText}>Loading staff roster...</Text>
              </View>
            ) : filteredStaff.length === 0 ? (
              <View style={styles.stateContainer}>
                <Ionicons name="alert-circle-outline" size={24} color={colors.text.muted} />
                <Text style={styles.stateText}>
                  {searchQuery ? `No staff found matching "${searchQuery}"` : 'No staff members available.'}
                </Text>
              </View>
            ) : (
              filteredStaff.map((staff) => {
                const isSelected = numericSelectedSet.has(staff.id);
                return (
                  <TouchableOpacity
                    key={staff.id}
                    onPress={() => handleToggleOption(staff.id)}
                    style={[styles.staffRow, isSelected && styles.staffRowSelected]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.selectionControl}>
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isSelected ? colors.accent : colors.border}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.staffName, isSelected && { color: colors.accent }]}>
                        {staff.name}
                      </Text>
                      <Text style={styles.staffEmail}>{staff.email}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  description: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  clearText: {
    color: colors.accent,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.elevated,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    maxWidth: '100%',
  },
  chipText: {
    color: colors.text.primary,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginRight: 6,
  },
  chipRemoveButton: {
    padding: 1,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  triggerActive: {
    borderColor: colors.accent,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  triggerText: {
    flex: 1,
    color: colors.text.muted,
    fontSize: 14,
  },
  dropdownPanel: {
    backgroundColor: colors.surface.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.accent,
    padding: 12,
    marginTop: -2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 13,
    padding: 0,
  },
  resultsContainer: {
    maxHeight: 220,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 10,
  },
  staffRowSelected: {
    backgroundColor: colors.surface.elevated,
  },
  selectionControl: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffName: {
    color: colors.text.primary,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  staffEmail: {
    color: colors.text.muted,
    fontSize: 11,
    marginTop: 1,
  },
  stateContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stateText: {
    color: colors.text.muted,
    fontSize: 12,
    textAlign: 'center',
  },
});
