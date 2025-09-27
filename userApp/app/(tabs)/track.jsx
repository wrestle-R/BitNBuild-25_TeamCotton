import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TrackScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Track</Text>
			<Text style={styles.subtitle}>Live order tracking will appear here.</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: '600',
	},
	subtitle: {
		marginTop: 8,
		color: '#666'
	}
});
