import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../../config/firebaseConfig";

type Gift = {
  id: string;
  userId: string;
  name: string;
  description: string;
  price: string;
  type: "online" | "brand" | "location";
  link?: string;
  brand?: string;
  country?: string;
  city?: string;
  place?: string;
};

export default function GiftsScreen() {
  const [gift, setGift] = useState<Omit<Gift, "id" | "userId">>({
    name: "",
    description: "",
    price: "",
    type: "online",
    link: "",
    brand: "",
    country: "",
    city: "",
    place: "",
  });

  const [gifts, setGifts] = useState<Gift[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "gifts"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGifts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Gift)));
    });
    return unsubscribe;
  }, [user]);

  const addGift = async () => {
    if (!gift.name.trim()) return alert("Please enter a gift name");
    await addDoc(collection(db, "gifts"), {
  name: gift.name,
  description: gift.description,
  userId: user?.uid || "guest",
});

    setGift({
      name: "",
      description: "",
      price: "",
      type: "online",
      link: "",
      brand: "",
      country: "",
      city: "",
      place: "",
    });
  };

  const deleteGift = async (id: string) => {
    await deleteDoc(doc(db, "gifts", id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎁 Add Gift</Text>

      {/* Basic Info */}
      <TextInput
        style={styles.input}
        placeholder="Gift name"
        value={gift.name}
        onChangeText={(t) => setGift({ ...gift, name: t })}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={gift.description}
        onChangeText={(t) => setGift({ ...gift, description: t })}
      />
      <TextInput
        style={styles.input}
        placeholder="Price (e.g. 70€)"
        value={gift.price}
        onChangeText={(t) => setGift({ ...gift, price: t })}
      />

      {/* Gift Type Selection */}
      <Text style={styles.label}>Where to buy?</Text>
      <View style={styles.optionRow}>
        {["online", "brand", "location"].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setGift({ ...gift, type: type as "online" | "brand" | "location" })}
            style={[
              styles.optionButton,
              gift.type === type && styles.optionSelected,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                gift.type === type && styles.optionTextSelected,
              ]}
            >
              {type === "online"
                ? "🌐 Online"
                : type === "brand"
                ? "🏷️ Brand"
                : "📍 Location"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conditional Inputs */}
      {gift.type === "online" && (
        <TextInput
          style={styles.input}
          placeholder="Product link"
          value={gift.link}
          onChangeText={(t) => setGift({ ...gift, link: t })}
        />
      )}

      {gift.type === "brand" && (
        <TextInput
          style={styles.input}
          placeholder="Brand name (e.g. Sephora)"
          value={gift.brand}
          onChangeText={(t) => setGift({ ...gift, brand: t })}
        />
      )}

      {gift.type === "location" && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={gift.country}
            onChangeText={(t) => setGift({ ...gift, country: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            value={gift.city}
            onChangeText={(t) => setGift({ ...gift, city: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Place / Store"
            value={gift.place}
            onChangeText={(t) => setGift({ ...gift, place: t })}
          />
        </>
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.button} onPress={addGift}>
        <Text style={styles.buttonText}>Add Gift</Text>
      </TouchableOpacity>

      {/* Gift List */}
      <FlatList
        data={gifts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.giftName}>{item.name}</Text>
              <Text style={styles.giftPrice}>{item.price}</Text>
              {item.description ? (
                <Text style={styles.giftDesc}>{item.description}</Text>
              ) : null}

              {item.type === "online" && item.link ? (
                <Text style={styles.detail}>🌐 {item.link}</Text>
              ) : item.type === "brand" && item.brand ? (
                <Text style={styles.detail}>🏷️ {item.brand}</Text>
              ) : item.type === "location" ? (
                <Text style={styles.detail}>
                  📍 {[item.place, item.city, item.country].filter(Boolean).join(", ")}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity onPress={() => deleteGift(item.id)}>
              <Text style={styles.deleteButton}>❌</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff8f9" },
  title: { fontSize: 26, fontWeight: "bold", color: "#ff6b81", marginBottom: 20 },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ffd6dc",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  label: { fontWeight: "bold", marginBottom: 6, color: "#ff6b81" },
  optionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  optionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffd6dc",
    alignItems: "center",
    marginHorizontal: 4,
  },
  optionSelected: { backgroundColor: "#ff6b81" },
  optionText: { color: "#444" },
  optionTextSelected: { color: "#fff", fontWeight: "bold" },
  button: {
    backgroundColor: "#ff6b81",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ffd6dc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  giftName: { fontWeight: "bold", color: "#ff5d73", fontSize: 16 },
  giftDesc: { color: "#555" },
  giftPrice: { fontWeight: "bold", color: "#333" },
  detail: { fontSize: 12, color: "#777" },
  deleteButton: { fontSize: 18, color: "#ff3b30", paddingLeft: 10 },
});
