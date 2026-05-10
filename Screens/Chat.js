import {
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Linking,
} from "react-native";

import firebase from "../Config";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { supabase } from "../Config";
import { Ionicons } from "@expo/vector-icons";

const database = firebase.database();
const ref_all_messages = database.ref("allmessages");

export default function Chat(props) {
  const currentid = props.route?.params?.currentid ?? null;
  const secondid = props.route?.params?.secondid ?? null;

  const [data, setdata] = useState([]);
  const [message, setMessage] = useState("");
  const [secondistyping, setSecondistyping] = useState(false);

  const iddiscussion = (currentid && secondid)
    ? (currentid > secondid ? currentid + secondid : secondid + currentid)
    : null;

  useEffect(() => {
    if (!iddiscussion) return;

    const ref_chat = ref_all_messages.child(iddiscussion).child("chat");
    const ref_second_istyping = ref_all_messages.child(iddiscussion).child(secondid + "istyping");

    ref_chat.on("value", (snapshot) => {
      const d = [];
      snapshot.forEach((one_message) => {
        d.push(one_message.val());
      });
      setdata(d);
    });

    ref_second_istyping.on("value", (snapshot) => {
      setSecondistyping(snapshot.val() === true);
    });

    return () => {
      ref_chat.off();
      ref_second_istyping.off();
    };
  }, [iddiscussion, secondid]);

  const uploadImageToSupabase = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const arraybuffer = await new Response(blob).arrayBuffer();

    const filenameInSupabase = Date.now() + ".jpg";

    const { error } = await supabase.storage
      .from("images")
      .upload(filenameInSupabase, arraybuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      Alert.alert("Erreur upload", error.message);
      return null;
    }

    const { data } = supabase.storage
      .from("images")
      .getPublicUrl(filenameInSupabase);

    return data.publicUrl;
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission requise",
        "Accès à la galerie nécessaire."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const link = await uploadImageToSupabase(localUri);

      if (!link || !iddiscussion) return;

      const ref_chat = ref_all_messages.child(iddiscussion).child("chat");
      ref_chat.push().set({
        idsender: currentid,
        idreceiver: secondid,
        imageUrl: link,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
  };

  const sendMessage = () => {
    if (!iddiscussion) {
      Alert.alert("Erreur", "IDs manquants");
      return;
    }
    if (!message.trim()) return;

    const ref_chat = ref_all_messages.child(iddiscussion).child("chat");
    ref_all_messages.child(iddiscussion).child(currentid + "istyping").set(false);

    ref_chat.push().set({
      idsender: currentid,
      idreceiver: secondid,
      message: message.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
    .then(() => setMessage(""))
    .catch((err) => Alert.alert("Erreur envoi", err.message));
  };

  const sendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Accès à la localisation nécessaire.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      if (!iddiscussion) {
        Alert.alert("Erreur", "IDs manquants");
        return;
      }

      const ref_chat = ref_all_messages.child(iddiscussion).child("chat");
      // URL pour Google Maps Static API avec marqueur
      const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=300x300&markers=color:red%7C${latitude},${longitude}`;

      ref_chat.push().set({
        idsender: currentid,
        idreceiver: secondid,
        mapImageUrl: mapImageUrl,
        latitude: latitude,
        longitude: longitude,
        isLocation: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
      .catch((err) => Alert.alert("Erreur envoi localisation", err.message));
    } catch (error) {
      Alert.alert("Erreur", "Impossible de récupérer la position");
    }
  };

  return (
    <ImageBackground
      style={styles.container}
      source={require("../assets/backgroundimg1.jpg")}
    >
      <Text style={{ fontWeight: 'bold', fontSize: 24, color: '#fff', marginTop: 20 }}>Chat</Text>

      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          const isSender = currentid === item.idsender;
          return (
            <View
              style={[
                styles.messageWrapper,
                isSender ? styles.senderWrapper : styles.receiverWrapper
              ]}
            >
              <View style={[
                styles.bubble,
                isSender ? styles.senderBubble : styles.receiverBubble
              ]}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: String(item.imageUrl) }}
                    style={{ width: 150, height: 150, borderRadius: 10, marginBottom: 4 }}
                    resizeMode="cover"
                  />
                ) : item.isLocation ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (item.latitude && item.longitude) {
                        const mapsUrl = `https://www.google.com/maps?q=${item.latitude},${item.longitude}`;
                        Linking.openURL(mapsUrl);
                      }
                    }}
                  >
                    <Image
                      source={require("../assets/localisation.jpg")}
                      style={{ width: 200, height: 200, borderRadius: 10, marginBottom: 4 }}
                      resizeMode="cover"
                    />
                    <View style={{ alignItems: 'center', marginTop: 8 }}>
                      <Text style={styles.locationText}>Lat: {item.latitude?.toFixed(4)}</Text>
                      <Text style={styles.locationText}>Lon: {item.longitude?.toFixed(4)}</Text>
                      <Text style={{ fontSize: 12, color: "#0066cc", marginTop: 4, fontWeight: 'bold' }}>Tap to view on Maps</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.messageText}>{String(item.message || "")}</Text>
                )}

                <Text style={styles.timeText}>{String(item.time || "")}</Text>
              </View>
            </View>
          );
        }}
        style={styles.list}
        contentContainerStyle={{ paddingVertical: 8 }}
      />

      {secondistyping && (
        <Text style={styles.typingText}>en train d'écrire...</Text>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={(txt) => {
            setMessage(txt);
          }}
          onFocus={() => {
            if (iddiscussion)
              ref_all_messages.child(iddiscussion).child(currentid + "istyping").set(true);
          }}
          onBlur={() => {
            if (iddiscussion)
              ref_all_messages.child(iddiscussion).child(currentid + "istyping").set(false);
          }}
          placeholder="Écrire un message..."
          placeholderTextColor="#080505"
          style={styles.input}
        />

        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Image
              source={require("../assets/sendmsg.png")}
              style={{ width: 20, height: 20, tintColor: '#fff' }}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
            <Image
              source={require("../assets/appareilPhoto.jpg")}
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={sendLocation} style={styles.locationButton}>
            <Image
              source={require("../assets/localisation.jpg")}
              style={{ width: 20, height: 20 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  list: {
    width: "100%",
    flex: 1,
  },
  messageWrapper: {
    width: "100%",
    paddingHorizontal: 10,
    marginVertical: 3,
    flexDirection: "row",
  },
  senderWrapper: {
    justifyContent: "flex-end",
  },
  receiverWrapper: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    elevation: 2,
  },
  senderBubble: {
    backgroundColor: "#B2DFDB",
    borderTopRightRadius: 2,
  },
  receiverBubble: {
    backgroundColor: "#FFF8E1",
    borderTopLeftRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#C9A84C",
  },
  buttonsContainer: {
  flexDirection: "row",
  alignItems: "center",
  marginLeft: 5,
},
  messageText: {
    fontSize: 15,
    color: "#004D40",
  },
  timeText: {
    fontSize: 11,
    color: "#00897B",
    textAlign: "right",
    marginTop: 4,
  },
  typingText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
  },
inputContainer: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 6,
  paddingVertical: 6,
  backgroundColor: "rgba(255,255,255,0.9)",
},
input: {
  flex: 1,
  height: 38,
  backgroundColor: "#F1FFFE",
  borderRadius: 20,
  paddingHorizontal: 10,
  fontSize: 13,
},
sendButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "#00897B",
  justifyContent: "center",
  alignItems: "center",
  marginLeft: 4,
},

iconButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "#e0f2f1",
  justifyContent: "center",
  alignItems: "center",
  marginLeft: 4,
},

locationButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "#d0f0ef",
  justifyContent: "center",
  alignItems: "center",
  marginLeft: 4,
},
  locationText: {
    fontSize: 12,
    color: "#004D40",
    marginVertical: 2,
  },
});