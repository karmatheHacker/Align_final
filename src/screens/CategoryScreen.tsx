import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    SafeAreaView,
    ScrollView,
    TextInput,
    Modal,
} from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';
import { Feather } from '@expo/vector-icons';

interface CategoryScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const SUB_CATEGORIES: Record<string, string[]> = {
    'Development & IT': [
        'Web Development',
        'Mobile Development',
        'Desktop Software Development',
        'Ecommerce Development',
        'Game Development',
        'Scripts & Utilities',
        'AI & Machine Learning',
        'Cloud Engineering',
        'DevOps',
        'Cybersecurity',
        'Database Administration',
        'Blockchain/Web3'
    ],
    'Design & Creative': [
        'Graphic Design',
        'UI/UX Design',
        'Web & Mobile Design',
        'Illustration',
        'Brand Identity & Strategy',
        'Motion Graphics',
        'Video Editing',
        'Photography',
        '3D Modeling & Rendering',
        'Product Design',
        'Animation',
        'Presentation Design'
    ],
    'Sales & Marketing': [
        'Social Media Marketing',
        'SEO (Search Engine Optimization)',
        'SEM (Search Engine Marketing)',
        'Email Marketing',
        'Content Marketing & Strategy',
        'Lead Generation',
        'Public Relations',
        'Telemarketing & Telesales',
        'Market Research',
        'Affiliate Marketing',
        'Marketing Automation'
    ],
    'Writing & Translation': [
        'Article & Blog Writing',
        'Copywriting',
        'Creative Writing',
        'Technical Writing',
        'Grant Writing',
        'Editing & Proofreading',
        'Translation',
        'Localization',
        'Ghostwriting',
        'Academic Writing'
    ],
    'Admin & Customer Support': [
        'Data Entry',
        'Virtual Assistance',
        'Customer Service',
        'Technical Support',
        'Order Processing',
        'Project Management',
        'Web Research',
        'Transcription',
        'Community Management'
    ],
    'Finance & Accounting': [
        'Accounting',
        'Bookkeeping',
        'Financial Analysis & Modeling',
        'Tax Preparation',
        'Payroll',
        'Auditing',
        'Corporate Finance',
        'Financial Consulting'
    ],
    'Engineering & Architecture': [
        'Civil Engineering',
        'Mechanical Engineering',
        'Electrical Engineering',
        'Architecture',
        'Interior Design',
        'CAD & Drafting',
        'BIM Modeling',
        'Structural Engineering'
    ],
    'Legal': [
        'Contract Law',
        'Intellectual Property',
        'Corporate Law',
        'Family Law',
        'Labor & Employment',
        'Criminal Law',
        'Legal Research & Writing',
        'Paralegal Services'
    ],
    'Business & Consulting': [
        'Business Analysis',
        'Operations Management',
        'Strategic Planning',
        'Supply Chain Management',
        'HR Consulting',
        'Risk Management',
        'Startup Consulting',
        'Event Planning'
    ],
    'Data Science & Analytics': [
        'Data Analysis',
        'Data Visualization',
        'Data Engineering',
        'Big Data',
        'AI & Machine Learning',
        'Data Extraction / ETL',
        'Quantitative Analysis',
        'A/B Testing'
    ]
};

const CATEGORIES = Object.keys(SUB_CATEGORIES).sort();

const CategoryScreen: React.FC<CategoryScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();

    const [selectedCategory, setSelectedCategory] = useState<string | null>(state.category || null);
    const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>(state.specializations || []);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleContinue = () => {
        if (!selectedCategory) return;
        saveField({
            category: selectedCategory,
            specializations: selectedSpecializations
        }).catch(() => undefined);

        dispatch({ type: 'SET_FIELD', field: 'category', value: selectedCategory });
        dispatch({ type: 'SET_FIELD', field: 'specializations', value: selectedSpecializations });
        onNext();
    };

    const handleSelectCategory = (cat: string) => {
        setSelectedCategory(cat);
        setSelectedSpecializations([]); // Reset specializations when category changes
        setSearchModalVisible(false);
    };

    const toggleSpecialization = (spec: string) => {
        setSelectedSpecializations(prev =>
            prev.includes(spec)
                ? prev.filter(s => s !== spec)
                : [...prev, spec]
        );
    };

    const filteredCategories = CATEGORIES.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const currentSpecializations = selectedCategory ? (SUB_CATEGORIES[selectedCategory] || []) : [];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.statusBarPlaceholder} />

            {/* Top Nav Bar */}
            <View style={styles.navBar}>
                <View style={styles.navIconContainer}>
                    <Text style={{ fontSize: 20 }}>👤</Text>
                </View>
                <Text style={styles.navTitle}>Create Your Profile</Text>
                <View style={styles.navIconContainer}>
                    <Text style={{ fontSize: 20, color: '#fff' }}>⋮</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.headerTitle}>Great! Let's find you the right jobs</Text>
                <Text style={styles.headerDesc}>
                    We'll use this information to show your profile to clients looking for your unique skills.
                </Text>

                <Text style={styles.subHeading}>Type of work you do</Text>
                <Text style={styles.instruction}>
                    Choose the category that best describes your work. It's OK if it's not a perfect match.
                </Text>

                <Text style={styles.dropdownLabel}>Category</Text>
                <TouchableOpacity
                    style={styles.dropdownTrigger}
                    activeOpacity={0.8}
                    onPress={() => setSearchModalVisible(true)}
                >
                    <Text style={[styles.dropdownSelectedText, selectedCategory && { color: '#ffffff' }]}>
                        {selectedCategory || 'Select a category'}
                    </Text>
                    <Feather name="chevron-down" size={20} color="#e0e0e0" />
                </TouchableOpacity>

                {selectedCategory && (
                    <View style={styles.specializationSection}>
                        <View style={styles.checkboxGroup}>
                            {currentSpecializations.map((spec, idx) => {
                                const isChecked = selectedSpecializations.includes(spec);
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.checkboxItem}
                                        activeOpacity={0.7}
                                        onPress={() => toggleSpecialization(spec)}
                                    >
                                        <View style={[
                                            styles.customCheckbox,
                                            isChecked && styles.customCheckboxChecked
                                        ]}>
                                            {isChecked && <Feather name="check" size={12} color="#ffffff" />}
                                        </View>
                                        <Text style={styles.checkboxLabel}>{spec}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Feather name="arrow-left" size={20} color="#1dbf73" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.nextBtn,
                        selectedCategory && styles.nextBtnActive
                    ]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                    disabled={!selectedCategory}
                >
                    <Text style={styles.nextBtnText}>Next</Text>
                </TouchableOpacity>
            </View>

            {/* Search Overlay Modal */}
            <Modal
                visible={searchModalVisible}
                animationType="none"
                transparent={true}
                onRequestClose={() => setSearchModalVisible(false)}
            >
                <SafeAreaView style={styles.searchOverlay}>
                    <View style={styles.searchHeader}>
                        <TouchableOpacity onPress={() => setSearchModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Text style={styles.closeIcon}>×</Text>
                        </TouchableOpacity>
                        <View style={styles.searchInputWrapper}>
                            <Text style={styles.searchEmoji}>🔍</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search categories"
                                placeholderTextColor="#888"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                        </View>
                    </View>

                    <ScrollView style={styles.categoryList}>
                        {filteredCategories.map((cat, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.categoryItem}
                                activeOpacity={0.7}
                                onPress={() => handleSelectCategory(cat)}
                            >
                                <View style={[
                                    styles.categoryRadio,
                                    selectedCategory === cat && styles.categoryRadioSelected
                                ]} />
                                <Text style={styles.categoryItemText}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f1012',
    },
    statusBarPlaceholder: {
        height: Platform.OS === 'android' ? 24 : 0,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222222',
        justifyContent: 'space-between',
    },
    navTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#ffffff',
    },
    navIconContainer: {
        width: 30,
        alignItems: 'center'
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        lineHeight: 34,
        color: '#ffffff',
        marginBottom: 12,
    },
    headerDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        lineHeight: 22,
        color: '#e0e0e0',
        opacity: 0.8,
        marginBottom: 32,
    },
    subHeading: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#ffffff',
        marginBottom: 8,
    },
    instruction: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#e0e0e0',
        lineHeight: 20,
        marginBottom: 20,
    },
    dropdownLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: '#ffffff',
        marginBottom: 8,
    },
    dropdownTrigger: {
        backgroundColor: '#1c1c1c',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    dropdownSelectedText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#888888',
    },
    specializationSection: {
        marginTop: 10,
    },
    checkboxGroup: {
        gap: 16,
    },
    checkboxItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    customCheckbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: '#444',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    customCheckboxChecked: {
        borderColor: '#ffffff',
    },
    checkboxLabel: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#e0e0e0',
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f1012',
        gap: 12,
    },
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#444',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    nextBtn: {
        flex: 1,
        backgroundColor: '#333333',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
    },
    nextBtnActive: {
        backgroundColor: '#1dbf73',
    },
    nextBtnText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: '#ffffff',
    },
    searchOverlay: {
        flex: 1,
        backgroundColor: '#0f1012',
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 15,
    },
    closeIcon: {
        fontSize: 32,
        color: '#e0e0e0',
        lineHeight: 32,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#252525',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
    },
    searchEmoji: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
    },
    categoryList: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#222222',
        gap: 15,
    },
    categoryRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#444',
    },
    categoryRadioSelected: {
        borderColor: '#1dbf73',
        backgroundColor: '#1dbf73',
        borderWidth: 6,
    },
    categoryItemText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#ffffff',
    }
});

export default CategoryScreen;
