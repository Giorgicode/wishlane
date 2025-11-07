import { auth } from '@/config/firebaseConfig';
import { getUserProfile, setUserProfile, UserProfile } from '@/lib/firestore';
import { uploadImageAsync } from '@/lib/storage';
import { useEffect, useState } from 'react';
import {
  Button,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function ProfileScreen() {
	const user = auth.currentUser;
	const uid = user?.uid ?? null;
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [showSetup, setShowSetup] = useState(false);

	// local form state
	const [displayName, setDisplayName] = useState('');
	const [photoURL, setPhotoURL] = useState('');
	const [description, setDescription] = useState('');
	const [gender, setGender] = useState<UserProfile['gender']>('');
	const [interests, setInterests] = useState<string[]>([]);
	const [relax, setRelax] = useState<string[]>([]);
	const [whatMakesYouHappy, setWhatMakesYouHappy] = useState('');

	useEffect(() => {
		let mounted = true;
		async function load() {
			if (!uid) {
				setLoading(false);
				return;
			}
			const p = await getUserProfile(uid);
			if (!mounted) return;
			setProfile(p);
			setLoading(false);
					if (!p) {
				// First time: open setup modal
				setShowSetup(true);
			} else {
				setDisplayName(p.displayName ?? '');
				setPhotoURL(p.photoURL ?? '');
				setDescription(p.description ?? '');
				setGender((p.gender as any) ?? '');
				setInterests(p.interests ?? []);
				setRelax(p.relax ?? []);
				setWhatMakesYouHappy(p.whatMakesYouHappy ?? '');
						setPriceRange(p.priceRange ?? '');
						setFavoriteColorsInput((p.favoriteColors || []).join(', '));
						setAllergiesInput((p.allergies || []).join(', '));
						setFavoriteBrandsInput((p.favoriteBrands || []).join(', '));
						setPreferredGiftTypes(p.preferredGiftTypes ?? []);
						setClothingSize(p.clothingSize ?? '');
						setShoeSize(p.shoeSize ?? '');
						setPreferredStoresInput((p.preferredStores || []).join(', '));
			}
		}
		load();
		return () => {
			mounted = false;
		};
	}, [uid]);

	const toggleArray = (arr: string[], set: (v: string[]) => void, item: string) => {
		if (arr.includes(item)) set(arr.filter((a) => a !== item));
		else set([...arr, item]);
	};

	const save = async () => {
		if (!uid) return;
		const payload: Partial<UserProfile> = {
			displayName,
			photoURL,
			description,
			gender,
			interests,
			relax,
			whatMakesYouHappy,
				priceRange,
				favoriteColors: favoriteColorsInput ? favoriteColorsInput.split(',').map(s => s.trim()).filter(Boolean) : [],
				allergies: allergiesInput ? allergiesInput.split(',').map(s => s.trim()).filter(Boolean) : [],
				favoriteBrands: favoriteBrandsInput ? favoriteBrandsInput.split(',').map(s => s.trim()).filter(Boolean) : [],
				preferredGiftTypes,
				clothingSize,
				shoeSize,
				preferredStores: preferredStoresInput ? preferredStoresInput.split(',').map(s => s.trim()).filter(Boolean) : [],
		};
		await setUserProfile(uid, payload);
		setProfile({ ...profile, ...payload } as UserProfile);
		setShowSetup(false);
	};

	// example option lists
	const interestOptions = [
		'activity',
		'reading',
		'cooking',
		'travel',
		'music',
		'art',
		'gardening',
		'tech',
		'gaming',
	];
	const sports = ['soccer', 'basketball', 'running', 'hiking', 'swimming', 'cycling'];
	const techs = ['gadgets', 'programming', 'ai', 'gaming', 'photography'];
	const relaxOptions = ['Spa day', 'Watching live sport', 'Extreme sports', 'Coffee in a nice place', 'Reading', 'Meditation'];
		const giftTypes = ['experience', 'physical', 'consumable', 'subscription', 'handmade', 'charity'];

		// extra form fields
		const [priceRange, setPriceRange] = useState<string>('');
		const [favoriteColorsInput, setFavoriteColorsInput] = useState('');
		const [allergiesInput, setAllergiesInput] = useState('');
		const [favoriteBrandsInput, setFavoriteBrandsInput] = useState('');
		const [preferredGiftTypes, setPreferredGiftTypes] = useState<string[]>([]);
		const [clothingSize, setClothingSize] = useState('');
		const [shoeSize, setShoeSize] = useState('');
		const [preferredStoresInput, setPreferredStoresInput] = useState('');

	if (loading) {
		return (
			<View style={styles.container}>
				<Text>Loading...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				{profile?.photoURL ? (
					<Image source={{ uri: profile.photoURL }} style={styles.avatar} />
				) : (
					<View style={styles.avatarPlaceholder} />
				)}
				<View style={{ marginLeft: 8 }}>
					<Text style={styles.name}>{profile?.displayName ?? user?.email ?? 'Guest'}</Text>
					<Text style={styles.small}>{profile?.description ?? ''}</Text>
				</View>
			</View>

			<ScrollView style={{ width: '100%', padding: 12 }}>
				<Text style={styles.sectionTitle}>About</Text>
				<Text>{profile?.description ?? 'No description yet.'}</Text>

				<Text style={styles.sectionTitle}>Interests</Text>
				<Text>{(profile?.interests || []).join(', ') || 'None selected'}</Text>

				<Text style={styles.sectionTitle}>How I relax</Text>
				<Text>{(profile?.relax || []).join(', ') || 'None selected'}</Text>

				<Text style={styles.sectionTitle}>What makes you happy?</Text>
				<Text>{profile?.whatMakesYouHappy ?? ''}</Text>

				<View style={{ height: 60 }} />
				<Button title="Edit profile" onPress={() => setShowSetup(true)} />
			</ScrollView>

			<Modal visible={showSetup} animationType="slide">
				<ScrollView contentContainerStyle={styles.modalContent}>
					<Text style={styles.modalTitle}>Set up your profile</Text>

								<Text style={styles.label}>Profile picture</Text>
								<View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
									<Button title="Pick photo" onPress={async () => {
										try {
											const ImagePicker = await import('expo-image-picker');
											const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
											if (!perm.granted) return alert('Permission required');
											const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
											// Handle both old and new ImagePicker result shapes
											if ((res as any).canceled === true || (res as any).cancelled === true) return;
											const localUri = (res as any).uri ?? (res as any).assets?.[0]?.uri;
											const remoteUrl = await uploadImageAsync(localUri, `users/${uid}/profile-${Date.now()}.jpg`);
											setPhotoURL(remoteUrl);
										} catch (e) {
											console.warn(e);
											alert('Could not pick/upload image');
										}
									}} />
									<TextInput value={photoURL} onChangeText={setPhotoURL} style={[styles.input, { flex: 1 }]} placeholder="or paste image url" />
								</View>

					<Text style={styles.label}>Display name</Text>
					<TextInput value={displayName} onChangeText={setDisplayName} style={styles.input} />

					<Text style={styles.label}>Short description</Text>
					<TextInput value={description} onChangeText={setDescription} style={[styles.input, { height: 80 }]} multiline />

					<Text style={styles.label}>Gender</Text>
					<View style={styles.row}>
						{(['female', 'male', 'other'] as UserProfile['gender'][]).map((g) => (
							<Pressable
								key={g}
								onPress={() => setGender(g)}
								style={[styles.choice, gender === g && styles.choiceSelected]}
							>
								<Text>{g}</Text>
							</Pressable>
						))}
					</View>

					<Text style={styles.label}>Interests (pick any)</Text>
					<View style={styles.wrap}>
						{interestOptions.map((it) => (
							<Pressable
								key={it}
								onPress={() => toggleArray(interests, setInterests, it)}
								style={[styles.choiceSmall, interests.includes(it) && styles.choiceSmallSelected]}
							>
								<Text>{it}</Text>
							</Pressable>
						))}
					</View>

					<Text style={styles.label}>Sports (examples)</Text>
					<View style={styles.wrap}>
						{sports.map((s) => (
							<Pressable key={s} onPress={() => toggleArray(interests, setInterests, s)} style={[styles.choiceSmall, interests.includes(s) && styles.choiceSmallSelected]}>
								<Text>{s}</Text>
							</Pressable>
						))}
					</View>

					<Text style={styles.label}>Tech interests</Text>
					<View style={styles.wrap}>
						{techs.map((t) => (
							<Pressable key={t} onPress={() => toggleArray(interests, setInterests, t)} style={[styles.choiceSmall, interests.includes(t) && styles.choiceSmallSelected]}>
								<Text>{t}</Text>
							</Pressable>
						))}
					</View>

					<Text style={styles.label}>How do you relax?</Text>
					<View style={styles.wrap}>
						{relaxOptions.map((r) => (
							<Pressable key={r} onPress={() => toggleArray(relax, setRelax, r)} style={[styles.choiceSmall, relax.includes(r) && styles.choiceSmallSelected]}>
								<Text>{r}</Text>
							</Pressable>
						))}
					</View>

					<Text style={styles.label}>What makes you happy?</Text>
					<TextInput value={whatMakesYouHappy} onChangeText={setWhatMakesYouHappy} style={[styles.input, { height: 80 }]} multiline />

								<Text style={styles.label}>Price range</Text>
								<View style={styles.row}>
									{['$', '$$', '$$$'].map((p) => (
										<Pressable key={p} onPress={() => setPriceRange(p)} style={[styles.choice, priceRange === p && styles.choiceSelected]}>
											<Text>{p}</Text>
										</Pressable>
									))}
								</View>

								<Text style={styles.label}>Favorite colors (comma separated)</Text>
								<TextInput value={favoriteColorsInput} onChangeText={setFavoriteColorsInput} style={styles.input} placeholder="red, blue, green" />

								<Text style={styles.label}>Allergies / dietary</Text>
								<TextInput value={allergiesInput} onChangeText={setAllergiesInput} style={styles.input} placeholder="peanuts, lactose" />

								<Text style={styles.label}>Favorite brands (comma separated)</Text>
								<TextInput value={favoriteBrandsInput} onChangeText={setFavoriteBrandsInput} style={styles.input} placeholder="BrandA, BrandB" />

								<Text style={styles.label}>Preferred gift types</Text>
								<View style={styles.wrap}>
									{giftTypes.map((g) => (
										<Pressable key={g} onPress={() => toggleArray(preferredGiftTypes, setPreferredGiftTypes, g)} style={[styles.choiceSmall, preferredGiftTypes.includes(g) && styles.choiceSmallSelected]}>
											<Text>{g}</Text>
										</Pressable>
									))}
								</View>

								<Text style={styles.label}>Clothing size</Text>
								<TextInput value={clothingSize} onChangeText={setClothingSize} style={styles.input} placeholder="M, L, 10 etc" />

								<Text style={styles.label}>Shoe size</Text>
								<TextInput value={shoeSize} onChangeText={setShoeSize} style={styles.input} placeholder="42, 9 etc" />

								<Text style={styles.label}>Preferred stores (comma separated)</Text>
								<TextInput value={preferredStoresInput} onChangeText={setPreferredStoresInput} style={styles.input} placeholder="Store1, Store2" />

					<View style={{ height: 12 }} />
					<Button title="Save profile" onPress={save} />
					<View style={{ height: 8 }} />
					<Button title="Cancel" onPress={() => setShowSetup(false)} />
				</ScrollView>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: 'center', paddingTop: 12 },
	header: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 12, marginBottom: 8 },
	avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ddd' },
	avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ddd' },
	name: { fontSize: 18, fontWeight: '600' },
	small: { color: '#666' },
	sectionTitle: { marginTop: 12, fontWeight: '600' },
	modalContent: { padding: 16 },
	modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
	label: { marginTop: 12, fontWeight: '600' },
	input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginTop: 6 },
	row: { flexDirection: 'row', gap: 8, marginTop: 8 },
	choice: { padding: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginRight: 8 },
	choiceSelected: { backgroundColor: '#DDEEFF' },
	wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
	choiceSmall: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, marginRight: 8, marginTop: 6 },
	choiceSmallSelected: { backgroundColor: '#DDEEFF' },
});
