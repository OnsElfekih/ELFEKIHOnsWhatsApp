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
} from "react-native";

import firebase from "../Config";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../Config";

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

        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Image
              source={require("../assets/sendmsg.png")}
              style={{ width: 25, height: 25, tintColor: '#fff' }}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={pickImage} style={{ marginLeft: 8 }}>
            <Image
              source={require("../assets/appareilPhoto.jpg")}
              style={{ width: 25, height: 25 }}
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
    height: 65,
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-evenly",
    backgroundColor: "rgba(255,255,255,0.88)",
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#B2DFDB",
  },
  input: {
    backgroundColor: "#F1FFFE",
    width: "78%",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    color: "#004D40",
  },
  sendButton: {
    backgroundColor: "#00897B",
    borderRadius: 50,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});