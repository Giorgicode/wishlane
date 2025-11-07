import { StyleSheet, Text, View } from 'react-native';

export default function SharedScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.text}>Shared (placeholder)</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	text: { fontSize: 18 },
});
