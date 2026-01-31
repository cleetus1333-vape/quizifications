import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Category } from '../types';
import { colors, spacing, borderRadius, fontSize, shadows, gradients } from '../constants/theme';

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
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('subject', { ascending: true });

      setCategories(cats || []);

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
      await supabase
        .from('user_categories')
        .delete()
        .eq('user_id', user.id);

      if (selectedIds.size > 0) {
        const inserts = Array.from(selectedIds).map(categoryId => ({
          user_id: user.id,
          category_id: categoryId,
        }));

        await supabase.from('user_categories').insert(inserts);
      }

      Alert.alert('Saved!', 'Your topics have been updated');
    } catch (error) {
      console.error('Error saving categories:', error);
      Alert.alert('Error', 'Failed to save topics');
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={Object.entries(groupedCategories)}
        keyExtractor={([subject]) => subject}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: [subject, cats] }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{subject}</Text>
            {cats.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedIds.has(category.id) && styles.categoryCardSelected,
                  shadows.sm,
                ]}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.8}
              >
                <View style={styles.categoryLeft}>
                  <View style={[
                    styles.categoryIconBg,
                    selectedIds.has(category.id) && styles.categoryIconBgSelected,
                  ]}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
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

      <View style={[styles.footer, shadows.lg]}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveSelections}
          disabled={saving}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.saveButtonText}>
                Save Selection ({selectedIds.size})
              </Text>
            )}
          </LinearGradient>
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
    paddingBottom: 120,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
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
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconBg: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryIconBgSelected: {
    backgroundColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
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
    width: 26,
    height: 26,
    borderRadius: borderRadius.xs,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
});
