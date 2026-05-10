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
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
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

  const [visibleImage, setVisibleImage] = useState(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reactionModalVisible, setReactionModalVisible] = useState(false);

  const [replyMessage, setReplyMessage] = useState(null);

  const iddiscussion =
    currentid && secondid
      ? currentid > secondid
        ? currentid + secondid
        : secondid + currentid
      : null;

  useEffect(() => {
    if (!iddiscussion) return;

    const ref_chat = ref_all_messages.child(iddiscussion).child("chat");
    const ref_second_istyping = ref_all_messages
      .child(iddiscussion)
      .child(secondid + "istyping");

    ref_chat.on("value", (snapshot) => {
      const d = [];
      snapshot.forEach((one_message) => {
        d.push({
          key: one_message.key,
          ...one_message.val(),
        });
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
      Alert.alert("Permission requise", "Accès à la galerie nécessaire.");
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
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
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

    ref_all_messages
      .child(iddiscussion)
      .child(currentid + "istyping")
      .set(false);

    ref_chat
      .push()
      .set({
        idsender: currentid,
        idreceiver: secondid,
        message: message.trim(),
        replyTo: replyMessage
          ? {
              message: replyMessage.message || "",
              imageUrl: replyMessage.imageUrl || "",
              idsender: replyMessage.idsender,
            }
          : null,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })

      .then(() => {
        setMessage("");
        setReplyMessage(null);

        ref_all_messages
          .child(iddiscussion)
          .child(currentid + "istyping")
          .remove();
      })

      .catch((err) => Alert.alert("Erreur envoi", err.message));
  };
  const downloadMedia = async (url, type = "image") => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission refusée", "Autorisez l'accès aux fichiers.");
        return;
      }

      const filename = Date.now() + (type === "video" ? ".mp4" : ".jpg");
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

      Alert.alert("Succès", "Image téléchargée dans la galerie");
    } catch (error) {
      Alert.alert("Erreur téléchargement", error.message);
    }
  };
  const sendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Accès à la localisation nécessaire.",
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = loc.coords;

      if (!iddiscussion) {
        Alert.alert("Erreur", "IDs manquants");
        return;
      }

      const ref_chat = ref_all_messages.child(iddiscussion).child("chat");
      // URL pour Google Maps Static API avec marqueur
      const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=300x300&markers=color:red%7C${latitude},${longitude}`;

      ref_chat
        .push()
        .set({
          idsender: currentid,
          idreceiver: secondid,
          mapImageUrl: mapImageUrl,
          latitude: latitude,
          longitude: longitude,
          isLocation: true,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        })
        .catch((err) => Alert.alert("Erreur envoi localisation", err.message));
    } catch (error) {
      Alert.alert("Erreur", "Impossible de récupérer la position");
    }
  };
  const addReaction = (reaction) => {
    if (!iddiscussion || !selectedMessage) return;

    ref_all_messages
      .child(iddiscussion)
      .child("chat")
      .child(selectedMessage.key)
      .child("reaction")
      .set(reaction);

    setReactionModalVisible(false);
    setSelectedMessage(null);
  };
  const deleteForMe = () => {
    if (!iddiscussion || !selectedMessage) return;

    ref_all_messages
      .child(iddiscussion)
      .child("chat")
      .child(selectedMessage.key)
      .child("deletedFor")
      .child(currentid)
      .set(true);

    setReactionModalVisible(false);
    setSelectedMessage(null);
  };

  const deleteForEveryone = () => {
    if (!iddiscussion || !selectedMessage) return;

    ref_all_messages
      .child(iddiscussion)
      .child("chat")
      .child(selectedMessage.key)
      .update({
        message: "Supprimé pour tous",
        imageUrl: null,
        mapImageUrl: null,
        latitude: null,
        longitude: null,
        isLocation: false,
        deletedForEveryone: true,
        reaction: null,
        replyTo: null,
      });

    setReactionModalVisible(false);
    setSelectedMessage(null);
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ImageBackground
        style={styles.container}
        source={require("../assets/backgroundimg1.jpg")}
      >
        <Text style={styles.title}>Chat</Text>

        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            const deletedForMe = item.deletedFor && item.deletedFor[currentid];
            const isSender = currentid === item.idsender;
            return (
              <View
                style={[
                  styles.messageWrapper,
                  isSender ? styles.senderWrapper : styles.receiverWrapper,
                ]}
              >
                <Pressable
                  onLongPress={() => {
                    setSelectedMessage(item);
                    setReactionModalVisible(true);
                  }}
                  delayLongPress={400}
                  style={[
                    styles.bubble,
                    isSender ? styles.senderBubble : styles.receiverBubble,
                  ]}
                >
                  {deletedForMe ? (
                    <Text style={styles.deletedMessageText}>
                      Supprimé pour moi
                    </Text>
                  ) : item.deletedForEveryone ? (
                    <Text style={styles.deletedMessageText}>
                      Supprimé pour tous
                    </Text>
                  ) : (
                    <>
                      {item.replyTo && (
                        <View style={styles.replyPreview}>
                          <Text style={styles.replyPreviewTitle}>Réponse</Text>
                          <Text style={styles.replyPreviewText}>
                            {item.replyTo.message
                              ? item.replyTo.message
                              : "Image"}
                          </Text>
                        </View>
                      )}
                      {item.imageUrl ? (
                        <TouchableOpacity
                          onPress={() => {
                            setVisibleImage(String(item.imageUrl));
                            setIsImageModalVisible(true);
                          }}
                          onLongPress={() => {
                            setSelectedMessage(item);
                            setReactionModalVisible(true);
                          }}
                        >
                          <Image
                            source={{ uri: String(item.imageUrl) }}
                            style={{
                              width: 150,
                              height: 150,
                              borderRadius: 10,
                              marginBottom: 4,
                            }}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ) : item.isLocation ? (
                        <TouchableOpacity
                          onPress={() => {
                            if (item.latitude && item.longitude) {
                              const mapsUrl = `https://www.google.com/maps?q=${item.latitude},${item.longitude}`;
                              Linking.openURL(mapsUrl);
                            }
                          }}
                          onLongPress={() => {
                            setSelectedMessage(item);
                            setReactionModalVisible(true);
                          }}
                        >
                          <Image
                            source={require("../assets/localisation.jpg")}
                            style={{
                              width: 200,
                              height: 200,
                              borderRadius: 10,
                              marginBottom: 4,
                            }}
                            resizeMode="cover"
                          />

                          <View style={{ alignItems: "center", marginTop: 8 }}>
                            <Text style={styles.locationText}>
                              Lat: {item.latitude?.toFixed(4)}
                            </Text>

                            <Text style={styles.locationText}>
                              Lon: {item.longitude?.toFixed(4)}
                            </Text>

                            <Text
                              style={{
                                fontSize: 12,
                                color: "#0066cc",
                                marginTop: 4,
                                fontWeight: "bold",
                              }}
                            >
                              Tap to view on Maps
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.messageText}>
                          {String(item.message || "")}
                        </Text>
                      )}
                    </>
                  )}
                  <Text style={styles.timeText}>{String(item.time || "")}</Text>

                  {item.reaction && (
                    <TouchableOpacity
                      onPress={() => {
                        ref_all_messages
                          .child(iddiscussion)
                          .child("chat")
                          .child(item.key)
                          .child("reaction")
                          .remove();
                      }}
                      style={styles.reactionBadge}
                    >
                      <Text style={styles.reactionText}>{item.reaction}</Text>
                    </TouchableOpacity>
                  )}
                </Pressable>
              </View>
            );
          }}
          style={styles.list}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
        {secondistyping && (
          <Text style={styles.typingText}>en train d'écrire...</Text>
        )}

        {replyMessage && (
          <View style={styles.replyBox}>
            <View style={styles.replyContent}>
              <Text style={styles.replyTitle}>Vous répondez à ce message</Text>

              <Text style={styles.replyText}>
                {replyMessage.message
                  ? replyMessage.message
                  : replyMessage.isLocation
                    ? "Localisation"
                    : "Image"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setReplyMessage(null);
              }}
              style={styles.cancelReplyButton}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            value={message}
            onChangeText={(txt) => {
              setMessage(txt);
            }}
            onFocus={() => {
              if (iddiscussion)
                ref_all_messages
                  .child(iddiscussion)
                  .child(currentid + "istyping")
                  .set(true);
            }}
            onBlur={() => {
              if (iddiscussion)
                ref_all_messages
                  .child(iddiscussion)
                  .child(currentid + "istyping")
                  .remove();
            }}
            placeholder="Écrire un message..."
            placeholderTextColor={colors.muted}
            style={styles.input}
          />

          <View style={styles.buttonsContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
              <Image
                source={require("../assets/appareilPhoto.jpg")}
                style={{ width: 20, height: 20 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={sendLocation}
              style={styles.locationButton}
            >
              <Image
                source={require("../assets/localisation.jpg")}
                style={{ width: 20, height: 20 }}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Image
                source={require("../assets/sendmsg.png")}
                style={{ width: 20, height: 20, tintColor: "#fff" }}
              />
            </TouchableOpacity>
          </View>
        </View>
        <Modal
          visible={reactionModalVisible}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.actionModalContainer}>
            <View style={styles.actionBox}>
              <TouchableOpacity
                style={styles.closeActionButton}
                onPress={() => {
                  setReactionModalVisible(false);
                  setSelectedMessage(null);
                }}
              >
                <Ionicons name="close" size={22} color="#2B1B26" />
              </TouchableOpacity>

              <View style={styles.emojiRow}>
                <TouchableOpacity onPress={() => addReaction("👍")}>
                  <Text style={styles.reactionIcon}>👍</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => addReaction("❤️")}>
                  <Text style={styles.reactionIcon}>❤️</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => addReaction("😂")}>
                  <Text style={styles.reactionIcon}>😂</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => addReaction("😮")}>
                  <Text style={styles.reactionIcon}>😮</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => addReaction("😢")}>
                  <Text style={styles.reactionIcon}>😢</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setReplyMessage(selectedMessage);
                  setReactionModalVisible(false);
                }}
              >
                <Ionicons name="return-down-forward" size={21} color="white" />
                <Text style={styles.actionText}>Répondre</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonDark}
                onPress={deleteForMe}
              >
                <Ionicons name="trash-outline" size={21} color="white" />
                <Text style={styles.actionText}>Supprimer pour moi</Text>
              </TouchableOpacity>

              {selectedMessage?.idsender === currentid && (
                <TouchableOpacity
                  style={styles.actionButtonDanger}
                  onPress={deleteForEveryone}
                >
                  <Ionicons name="ban-outline" size={21} color="white" />
                  <Text style={styles.actionText}>Supprimer pour tous</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.fullScreenContainer}>
            <TouchableOpacity
              style={styles.closeImageButton}
              onPress={() => {
                setIsImageModalVisible(false);
              }}
            >
              <Ionicons name="close" size={35} color="white" />
            </TouchableOpacity>

            <View style={styles.imageBox}>
              {visibleImage && (
                <Image
                  source={{ uri: visibleImage }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => {
                  Alert.alert("Téléchargement", "Télécharger cette image ?", [
                    {
                      text: "Annuler",
                      style: "cancel",
                    },
                    {
                      text: "Télécharger",
                      onPress: () => {
                        Linking.openURL(visibleImage);
                      },
                    },
                  ]);
                }}
              >
                <Ionicons name="download" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const colors = {
  primary: "#6D2E5B",
  primaryDark: "#3B1D33",
  primaryLight: "#B135A3",
  card: "#0006",
  input: "#FFF8FC",
  textDark: "#2B1B26",
  textLight: "#FFFFFF",
  border: "#B135A3",
  muted: "#777",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.primary,
  },

  title: {
    fontWeight: "bold",
    fontSize: 28,
    color: "#2B1B26",

    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 25,
    marginBottom: 8,
    overflow: "hidden",
  },

  list: {
    width: "100%",
    flex: 1,
  },

  messageWrapper: {
    width: "100%",
    paddingHorizontal: 10,
    marginVertical: 8,
    flexDirection: "row",
  },

  senderWrapper: {
    justifyContent: "flex-end",
  },

  receiverWrapper: {
    justifyContent: "flex-start",
  },

  bubble: {
    maxWidth: "78%",
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 16,
    marginBottom: 5,
  },

  senderBubble: {
    backgroundColor: "#F7D9F1",
    borderTopRightRadius: 3,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },

  receiverBubble: {
    backgroundColor: colors.input,
    borderTopLeftRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryLight,
  },

  messageText: {
    fontSize: 15,
    color: "#2B1B26",
    fontWeight: "500",
  },

  timeText: {
    fontSize: 11,
    color: "#6D2E5B",
    textAlign: "right",
    marginTop: 4,
    fontWeight: "bold",
  },

  typingText: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: "italic",
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "96%",
    paddingHorizontal: 6,
    paddingVertical: 7,
    backgroundColor: colors.card,
    borderRadius: 25,
    marginBottom: 8,
  },

  input: {
    flex: 1,
    height: 40,
    backgroundColor: colors.input,
    color: colors.textDark,
    borderRadius: 20,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 5,
  },

  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.input,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },

  locationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.input,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },

  locationText: {
    fontSize: 12,
    color: colors.textDark,
    marginVertical: 2,
  },

  closeImageButton: {
    position: "absolute",
    top: 45,
    right: 20,
    zIndex: 10,
  },

  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  imageBox: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  fullScreenImage: {
    width: 350,
    height: 500,
  },

  downloadButton: {
    position: "absolute",
    bottom: 35,
    right: 25,
    backgroundColor: "#B135A3",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  reactionBadge: {
    position: "absolute",
    bottom: -14,
    right: 8,
    backgroundColor: "#FFF8FC",
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#B135A3",
  },

  reactionText: {
    fontSize: 16,
  },

  reactionModalContainer: {
    flex: 1,
    backgroundColor: "#0004",
    justifyContent: "center",
    alignItems: "center",
  },

  reactionBox: {
    flexDirection: "row",
    backgroundColor: "#FFF8FC",
    borderRadius: 25,
    padding: 12,
    paddingLeft: 36,
    borderWidth: 2,
    borderColor: "#B135A3",
    position: "relative",
  },

  closeReactionButton: {
    position: "absolute",
    left: 8,
    top: 13,
  },

  reactionIcon: {
    fontSize: 28,
    marginHorizontal: 8,
  },
  replyBox: {
    width: "96%",
    backgroundColor: "#FFF8FC",
    borderLeftWidth: 4,
    borderLeftColor: "#B135A3",
    padding: 8,
    borderRadius: 10,
    marginBottom: 5,
  },

  replyTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#B135A3",
  },

  replyText: {
    fontSize: 13,
    color: "#2B1B26",
    marginTop: 2,
  },

  cancelReplyButton: {
    position: "absolute",
    right: 8,
    top: 10,
    backgroundColor: "#B135A3",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  replyPreview: {
    backgroundColor: "#ffffff99",
    borderLeftWidth: 3,
    borderLeftColor: "#B135A3",
    padding: 6,
    borderRadius: 8,
    marginBottom: 6,
  },

  replyPreviewTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#B135A3",
  },

  replyPreviewText: {
    fontSize: 12,
    color: "#2B1B26",
  },
  replyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B135A3",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    marginTop: 12,
  },

  replyActionText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 6,
  },
  deletedMessageText: {
    fontSize: 14,
    color: "#777",
    fontStyle: "italic",
  },

  deleteMeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B1D33",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    marginTop: 10,
  },

  deleteAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C62828",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    marginTop: 10,
  },

  deleteActionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 6,
  },
  actionModalContainer: {
    flex: 1,
    backgroundColor: "#0005",
    justifyContent: "center",
    alignItems: "center",
  },

  actionBox: {
    width: "86%",
    backgroundColor: "#FFF8FC",
    borderRadius: 22,
    padding: 18,
    borderWidth: 2,
    borderColor: "#B135A3",
    alignItems: "center",
  },

  closeActionButton: {
    position: "absolute",
    top: 10,
    right: 12,
  },

  emojiRow: {
    flexDirection: "row",
    marginTop: 16,
    marginBottom: 18,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B135A3",
    width: "100%",
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 8,
  },

  actionButtonDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B1D33",
    width: "100%",
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 8,
  },

  actionButtonDanger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C62828",
    width: "100%",
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 8,
  },

  actionText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
