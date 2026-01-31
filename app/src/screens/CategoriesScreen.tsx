// src/screens/CategoriesScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Category } from '../types';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

export default function CategoriesScreen() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('subject', { ascending: true });

      setCategories(cats || []);

      // Load user's selected categories
      if (user) {
        const { data: userCats } = await supabase
          .from('user_categories')
          .select('category_id')
          .eq('user_id', user.id);

        if (userCats) {
          setSelectedIds(new Set(userCats.map(uc => uc.category_id)));
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const saveSelections = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Delete existing selections
      await supabase
        .from('user_categories')
        .delete()
        .eq('user_id', user.id);

      // Insert new selections
      if (selectedIds.size > 0) {
        const inserts = Array.from(selectedIds).map(categoryId => ({
          user_id: user.id,
          category_id: categoryId,
        }));

        await supabase.from('user_categories').insert(inserts);
      }

      alert('Categories saved!');
    } catch (error) {
      console.error('Error saving categories:', error);
      alert('Failed to save categories');
    } finally {
      setSaving(false);
    }
  };

  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.subject]) {
      acc[cat.subject] = [];
    }
    acc[cat.subject].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={Object.entries(groupedCategories)}
        keyExtractor={([subject]) => subject}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: [subject, cats] }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{subject}</Text>
            {cats.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedIds.has(category.id) && styles.categoryCardSelected,
                ]}
                onPress={() => toggleCategory(category.id)}
              >
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>
                      {category.question_count} questions
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.checkbox,
                  selectedIds.has(category.id) && styles.checkboxSelected,
                ]}>
                  {selectedIds.has(category.id) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveSelections}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>
              Save ({selectedIds.size} selected)
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  categoryCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.background,
  },
});
