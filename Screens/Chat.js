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
import { Video, Audio } from "expo-av";
import * as Clipboard from "expo-clipboard";

const database = firebase.database();
const ref_all_messages = database.ref("allmessages");
const ref_all_accounts = database.ref("allaccounts");

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
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [mediaType, setMediaType] = useState("images");

  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [nickname, setNickname] = useState("");
  const [savedNickname, setSavedNickname] = useState("");
  const [recording, setRecording] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [myNickname, setMyNickname] = useState("");
  const [nicknameChoiceVisible, setNicknameChoiceVisible] = useState(false);
  const [nicknameTarget, setNicknameTarget] = useState("contact");

  const [chatBackground, setChatBackground] = useState(null);
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);

  const [visibleVideo, setVisibleVideo] = useState(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

  const [contacts, setContacts] = useState([]);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);

  const [editingMessage, setEditingMessage] = useState(null);
  const [editedText, setEditedText] = useState("");

  const iddiscussion =
    currentid && secondid
      ? currentid > secondid
        ? currentid + secondid
        : secondid + currentid
      : null;

  useEffect(() => {
    if (!iddiscussion) return;
    ref_all_accounts.on("value", (snapshot) => {
      const d = [];

      snapshot.forEach((one_account) => {
        const account = one_account.val();

        if (account.Id !== currentid) {
          d.push(account);
        }
      });

      setContacts(d);
    });
    const ref_nickname = ref_all_messages
      .child(iddiscussion)
      .child("nicknames")
      .child(secondid);

    const ref_my_nickname = ref_all_messages
      .child(iddiscussion)
      .child("nicknames")
      .child(currentid);

    const ref_chat = ref_all_messages.child(iddiscussion).child("chat");

    const ref_second_istyping = ref_all_messages
      .child(iddiscussion)
      .child(secondid + "istyping");

    ref_nickname.on("value", (snapshot) => {
      setSavedNickname(snapshot.val() || "");
    });

    ref_my_nickname.on("value", (snapshot) => {
      setMyNickname(snapshot.val() || "");
    });

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

    const ref_background = ref_all_messages
      .child(iddiscussion)
      .child("background");

    ref_background.on("value", (snapshot) => {
      setChatBackground(snapshot.val());
    });

    return () => {
      ref_chat.off();
      ref_second_istyping.off();
      ref_nickname.off();
      ref_my_nickname.off();
      ref_background.off();
      ref_all_accounts.off();
    };
  }, [iddiscussion, secondid, currentid]);
  const changeChatBackground = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission requise", "Accès à la galerie nécessaire.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      const link = await uploadFileToSupabase(asset.uri, "image");

      if (!link || !iddiscussion) return;

      ref_all_messages.child(iddiscussion).child("background").set(link);

      ref_all_messages
        .child(iddiscussion)
        .child("chat")
        .push()
        .set({
          idsender: "system",
          idreceiver: "system",
          systemMessage: "Le fond de la conversation a été changé",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
    }
  };
  const uploadFileToSupabase = async (url, type = "image") => {
    const response = await fetch(url);

    const blob = await response.blob();

    const arraybuffer = await new Response(blob).arrayBuffer();

    const extension =
      type === "video" ? ".mp4" : type === "audio" ? ".m4a" : ".jpg";

    const contentType =
      type === "video"
        ? "video/mp4"
        : type === "audio"
          ? "audio/m4a"
          : "image/jpeg";

    const filenameInSupabase = Date.now() + extension;

    const { error } = await supabase.storage
      .from("images")
      .upload(filenameInSupabase, arraybuffer, {
        contentType: contentType,
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
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      const localUri = asset.uri;

      const link = await uploadFileToSupabase(
        localUri,
        asset.type === "video" ? "video" : "image",
      );

      if (!link || !iddiscussion) return;

      const ref_chat = ref_all_messages.child(iddiscussion).child("chat");
      ref_chat.push().set({
        idsender: currentid,
        idreceiver: secondid,

        ...(asset.type === "video" ? { videoUrl: link } : { imageUrl: link }),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
  };
  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission requise", "Accès à la caméra nécessaire.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const link = await uploadFileToSupabase(asset.uri, "image");

      if (!link || !iddiscussion) return;

      ref_all_messages
        .child(iddiscussion)
        .child("chat")
        .push()
        .set({
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
  const sendForwardToContact = (contact) => {
    if (!selectedMessage || !currentid || !contact.Id) return;

    const forwardDiscussionId =
      currentid > contact.Id ? currentid + contact.Id : contact.Id + currentid;

    const forwardedData = {
      idsender: currentid,
      idreceiver: contact.Id,
      forwarded: true,
      message: selectedMessage.message || "",
      imageUrl: selectedMessage.imageUrl || null,
      videoUrl: selectedMessage.videoUrl || null,
      audioUrl: selectedMessage.audioUrl || null,
      latitude: selectedMessage.latitude || null,
      longitude: selectedMessage.longitude || null,
      isLocation: selectedMessage.isLocation || false,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    ref_all_messages
      .child(forwardDiscussionId)
      .child("chat")
      .push()
      .set(forwardedData);

    setForwardModalVisible(false);
    setSelectedMessage(null);

    Alert.alert("Transféré", "Message transféré avec succès.");
  };
  const openVideoCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission requise", "Accès à la caméra nécessaire.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.5,
      videoMaxDuration: 30,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const link = await uploadFileToSupabase(asset.uri, "video");

      if (!link || !iddiscussion) return;

      ref_all_messages
        .child(iddiscussion)
        .child("chat")
        .push()
        .set({
          idsender: currentid,
          idreceiver: secondid,
          videoUrl: link,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
    }
  };
  const pickVideo = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission requise", "Accès à la galerie nécessaire.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const link = await uploadFileToSupabase(asset.uri, "video");

      if (!link || !iddiscussion) return;

      ref_all_messages
        .child(iddiscussion)
        .child("chat")
        .push()
        .set({
          idsender: currentid,
          idreceiver: secondid,
          videoUrl: link,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
    }
  };
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission requise", "Accès au micro nécessaire.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      setRecording(recording);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de démarrer l'enregistrement.");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();

      setRecording(null);

      const link = await uploadFileToSupabase(uri, "audio");

      if (!link || !iddiscussion) return;

      ref_all_messages
        .child(iddiscussion)
        .child("chat")
        .push()
        .set({
          idsender: currentid,
          idreceiver: secondid,
          audioUrl: link,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'envoyer le vocal.");
    }
  };
  const playAudioMessage = async (audioUrl, messageKey) => {
    try {
      setPlayingAudio(messageKey);

      const { sound } = await Audio.Sound.createAsync({
        uri: String(audioUrl),
      });

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAudio(null);
        }
      });
    } catch (error) {
      setPlayingAudio(null);

      Alert.alert("Erreur", "Impossible de lire le vocal.");
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
        Alert.alert("Permission refusée", "Autorisez l'accès à la galerie.");
        return;
      }

      const filename = Date.now() + (type === "video" ? ".mp4" : ".jpg");
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      await MediaLibrary.createAssetAsync(downloadResult.uri);

      Alert.alert(
        "Succès",
        type === "video"
          ? "Vidéo téléchargée dans la galerie"
          : "Image téléchargée dans la galerie",
      );
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
  const pinMessage = () => {
    if (!iddiscussion || !selectedMessage) return;

    ref_all_messages
      .child(iddiscussion)
      .child("chat")
      .child(selectedMessage.key)
      .child("pinned")
      .set(true);

    setReactionModalVisible(false);
    setSelectedMessage(null);
  };
  const getMediaData = () => {
    if (mediaType === "images") {
      return data.filter((item) => item.imageUrl);
    }

    if (mediaType === "videos") {
      return data.filter((item) => item.videoUrl);
    }

    if (mediaType === "links") {
      return data.filter((item) => {
        const msg = String(item.message || "");

        return msg.includes("http://") || msg.includes("https://");
      });
    }

    if (mediaType === "pinned") {
      return data.filter((item) => item.pinned);
    }

    if (mediaType === "locations") {
      return data.filter((item) => item.isLocation);
    }
    if (mediaType === "audios") {
      return data.filter((item) => item.audioUrl);
    }

    return [];
  };
  const saveNickname = () => {
    if (!iddiscussion) return;

    const targetId = nicknameTarget === "contact" ? secondid : currentid;

    ref_all_messages
      .child(iddiscussion)
      .child("nicknames")
      .child(targetId)
      .set(nickname);

    ref_all_messages
      .child(iddiscussion)
      .child("chat")
      .push()
      .set({
        idsender: "system",
        idreceiver: "system",
        systemMessage:
          (myNickname || "Le contact") + " a changé le surnom en " + nickname,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

    if (nicknameTarget === "contact") {
      setSavedNickname(nickname);
    } else {
      setMyNickname(nickname);
    }

    setNickname("");
    setNicknameModalVisible(false);
  };
  const copyMessage = async () => {
    if (!selectedMessage) return;

    const text =
      selectedMessage.message ||
      selectedMessage.imageUrl ||
      selectedMessage.videoUrl ||
      selectedMessage.audioUrl ||
      (selectedMessage.isLocation
        ? `https://www.google.com/maps?q=${selectedMessage.latitude},${selectedMessage.longitude}`
        : "");

    if (!text) return;

    await Clipboard.setStringAsync(String(text));

    setReactionModalVisible(false);
    setSelectedMessage(null);

    Alert.alert("Copié", "Message copié.");
  };

  const forwardMessage = () => {
    if (!selectedMessage) return;

    setReactionModalVisible(false);
    setForwardModalVisible(true);
  };
  const editMessage = () => {
    if (!iddiscussion || !editingMessage) return;

    if (!editedText.trim()) return;

    ref_all_messages
      .child(iddiscussion)
      .child("chat")
      .child(editingMessage.key)
      .update({
        message: editedText,
        edited: true,
      });

    setEditingMessage(null);
    setEditedText("");
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ImageBackground
        style={styles.container}
        source={
          chatBackground
            ? { uri: chatBackground }
            : require("../assets/backgroundimg1.jpg")
        }
      >
        <TouchableOpacity
          onLongPress={() => {
            setNicknameChoiceVisible(true);
          }}
        >
          <Text style={styles.title}>
            {savedNickname ? savedNickname : "Chat"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={() => {
            setMediaModalVisible(true);
          }}
        >
          <Ionicons name="folder-open" size={20} color="white" />
          <Text style={styles.mediaButtonText}>Médias partagés</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={changeChatBackground}
        >
          <Ionicons name="image" size={20} color="white" />
          <Text style={styles.mediaButtonText}>Changer le fond</Text>
        </TouchableOpacity>

        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            if (item.systemMessage) {
              return (
                <View style={styles.systemMessageBox}>
                  <Text style={styles.systemMessageText}>
                    {item.systemMessage}
                  </Text>
                </View>
              );
            }
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
                      {item.audioUrl ? (
                        <TouchableOpacity
                          style={styles.audioBox}
                          onPress={() => {
                            playAudioMessage(item.audioUrl, item.key);
                          }}
                        >
                          <Ionicons
                            name={
                              playingAudio === item.key ? "volume-high" : "play"
                            }
                            size={22}
                            color="white"
                          />
                          <View style={styles.audioWave}>
                            <View style={styles.waveBar} />
                            <View style={[styles.waveBar, { height: 18 }]} />
                            <View style={[styles.waveBar, { height: 10 }]} />
                            <View style={[styles.waveBar, { height: 20 }]} />
                            <View style={[styles.waveBar, { height: 14 }]} />
                          </View>
                        </TouchableOpacity>
                      ) : item.videoUrl ? (
                        <TouchableOpacity
                          onPress={() => {
                            setVisibleVideo(String(item.videoUrl));
                            setIsVideoModalVisible(true);
                          }}
                        >
                          <Video
                            source={{ uri: String(item.videoUrl) }}
                            style={{
                              width: 220,
                              height: 220,
                              borderRadius: 10,
                              marginBottom: 4,
                            }}
                            useNativeControls
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      ) : item.imageUrl ? (
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
                            Linking.openURL(
                              `https://www.google.com/maps?q=${item.latitude},${item.longitude}`,
                            );
                          }}
                        >
                          <Text style={styles.locationText}>
                            📍 Localisation partagée
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.messageText}>
                          {String(item.message || "")}
                        </Text>
                      )}
                    </>
                  )}
                  {item.pinned && (
                    <Text style={styles.pinnedText}>📌 Message épinglé</Text>
                  )}
                  <Text style={styles.timeText}>
                    {String(item.time || "")}
                    {item.edited ? " • modifié" : ""}
                  </Text>
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
            value={editingMessage ? editedText : message}
            onChangeText={(txt) => {
              if (editingMessage) {
                setEditedText(txt);
              } else {
                setMessage(txt);
              }
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
            <TouchableOpacity
              onPress={openCamera}
              onLongPress={openVideoCamera}
              style={styles.iconButton}
            >
              <Ionicons name="camera" size={22} color="#B135A3" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickImage}
              onLongPress={pickVideo}
              style={styles.iconButton}
            >
              <Ionicons name="image" size={22} color="#B135A3" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={sendLocation}
              style={styles.locationButton}
            >
              <Ionicons name="location" size={22} color="#B135A3" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (recording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              style={recording ? styles.recordingButton : styles.voiceButton}
            >
              <Ionicons
                name={recording ? "stop" : "mic"}
                size={22}
                color="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (editingMessage) {
                  editMessage();
                } else {
                  sendMessage();
                }
              }}
              style={styles.sendButton}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <Modal
          visible={nicknameChoiceVisible}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.nicknameModalContainer}>
            <View style={styles.nicknameBox}>
              <Text style={styles.nicknameTitle}>Surnoms</Text>

              <TouchableOpacity
                style={styles.nicknameOption}
                onPress={() => {
                  setNicknameTarget("contact");
                  setNickname(savedNickname);
                  setNicknameChoiceVisible(false);
                  setNicknameModalVisible(true);
                }}
              >
                <Text style={styles.nicknameOptionText}>
                  Contact: {savedNickname ? savedNickname : "Nom du contact"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nicknameOption}
                onPress={() => {
                  setNicknameTarget("me");
                  setNickname(myNickname);
                  setNicknameChoiceVisible(false);
                  setNicknameModalVisible(true);
                }}
              >
                <Text style={styles.nicknameOptionText}>
                  Moi: {myNickname ? myNickname : "Votre nom"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nicknameCancelButton}
                onPress={() => {
                  setNicknameChoiceVisible(false);
                }}
              >
                <Text style={styles.nicknameCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          visible={nicknameModalVisible}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.nicknameModalContainer}>
            <View style={styles.nicknameBox}>
              <Text style={styles.nicknameTitle}>Modifier le surnom</Text>

              <TextInput
                value={nickname}
                onChangeText={(txt) => {
                  setNickname(txt);
                }}
                placeholder="Entrer un surnom..."
                placeholderTextColor="#777"
                style={styles.nicknameInput}
              />

              <TouchableOpacity
                style={styles.nicknameSaveButton}
                onPress={saveNickname}
              >
                <Text style={styles.nicknameSaveText}>Enregistrer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nicknameCancelButton}
                onPress={() => {
                  setNicknameModalVisible(false);
                }}
              >
                <Text style={styles.nicknameCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          visible={mediaModalVisible}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.mediaModalContainer}>
            <View style={styles.mediaBox}>
              <TouchableOpacity
                style={styles.closeMediaButton}
                onPress={() => {
                  setMediaModalVisible(false);
                }}
              >
                <Ionicons name="close" size={24} color="#2B1B26" />
              </TouchableOpacity>

              <Text style={styles.mediaTitle}>Historique partagé</Text>

              <View style={styles.mediaTabs}>
                <TouchableOpacity onPress={() => setMediaType("images")}>
                  <Text style={styles.mediaTab}>Images</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMediaType("videos")}>
                  <Text style={styles.mediaTab}>Vidéos</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMediaType("links")}>
                  <Text style={styles.mediaTab}>Liens</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMediaType("pinned")}>
                  <Text style={styles.mediaTab}>Épinglés</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMediaType("locations")}>
                  <Text style={styles.mediaTab}>Localisations</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMediaType("audios")}>
                  <Text style={styles.mediaTab}>Vocaux</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={getMediaData()}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => {
                  return (
                    <TouchableOpacity
                      style={styles.mediaItem}
                      onPress={() => {
                        if (item.imageUrl) {
                          setVisibleImage(String(item.imageUrl));
                          setIsImageModalVisible(true);
                          setMediaModalVisible(false);
                        } else if (item.isLocation) {
                          Linking.openURL(
                            `https://www.google.com/maps?q=${item.latitude},${item.longitude}`,
                          );
                        } else if (item.message) {
                          Linking.openURL(String(item.message));
                        }
                      }}
                    >
                      {item.audioUrl ? (
                        <TouchableOpacity
                          style={styles.audioBox}
                          onPress={() => {
                            playAudioMessage(item.audioUrl, item.key);
                          }}
                        >
                          <Ionicons
                            name={
                              playingAudio === item.key ? "volume-high" : "play"
                            }
                            size={22}
                            color="white"
                          />
                          <View style={styles.audioWave}>
                            <View style={styles.waveBar} />
                            <View style={[styles.waveBar, { height: 18 }]} />
                            <View style={[styles.waveBar, { height: 10 }]} />
                            <View style={[styles.waveBar, { height: 20 }]} />
                            <View style={[styles.waveBar, { height: 14 }]} />
                          </View>
                        </TouchableOpacity>
                      ) : item.videoUrl ? (
                        <TouchableOpacity
                          onPress={() => {
                            setVisibleVideo(String(item.videoUrl));
                            setIsVideoModalVisible(true);
                          }}
                        >
                          <Video
                            source={{ uri: String(item.videoUrl) }}
                            style={{
                              width: 220,
                              height: 220,
                              borderRadius: 10,
                              marginBottom: 4,
                            }}
                            useNativeControls
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      ) : item.imageUrl ? (
                        <Image
                          source={{ uri: String(item.imageUrl) }}
                          style={styles.mediaImage}
                        />
                      ) : item.isLocation ? (
                        <Text style={styles.mediaText}>
                          📍 Localisation partagée
                        </Text>
                      ) : item.pinned ? (
                        <Text style={styles.mediaText}>
                          📌 {item.message || "Message épinglé"}
                        </Text>
                      ) : (
                        <Text style={styles.mediaText}>{item.message}</Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
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
                style={styles.actionButton}
                onPress={copyMessage}
              >
                <Ionicons name="copy" size={21} color="white" />
                <Text style={styles.actionText}>Copier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={forwardMessage}
              >
                <Ionicons name="arrow-redo" size={21} color="white" />
                <Text style={styles.actionText}>Transférer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButtonPin}
                onPress={pinMessage}
              >
                <Ionicons name="pin" size={21} color="white" />
                <Text style={styles.actionText}>Épingler</Text>
              </TouchableOpacity>
              {selectedMessage?.idsender === currentid &&
                selectedMessage?.message && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setEditedText(selectedMessage.message);
                      setEditingMessage(selectedMessage);
                      setReactionModalVisible(false);
                    }}
                  >
                    <Ionicons name="create" size={21} color="white" />
                    <Text style={styles.actionText}>Modifier</Text>
                  </TouchableOpacity>
                )}
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
        <Modal
          visible={isVideoModalVisible}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.fullScreenContainer}>
            <TouchableOpacity
              style={styles.closeImageButton}
              onPress={() => {
                setIsVideoModalVisible(false);
              }}
            >
              <Ionicons name="close" size={35} color="white" />
            </TouchableOpacity>

            <View style={styles.imageBox}>
              {visibleVideo && (
                <Video
                  source={{ uri: visibleVideo }}
                  style={styles.fullScreenVideo}
                  useNativeControls
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </Modal>
        <Modal visible={forwardModalVisible} transparent animationType="fade">
          <View style={styles.actionModalContainer}>
            <View style={styles.actionBox}>
              <Text style={styles.mediaTitle}>Transférer à</Text>

              <FlatList
                data={contacts}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.forwardContactRow}
                    onPress={() => sendForwardToContact(item)}
                  >
                    <Ionicons name="person-circle" size={28} color="#B135A3" />

                    <Text style={styles.forwardContactText}>
                      {item.Nom || item.Pseudo || item.Email || "Contact"}
                    </Text>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                style={styles.actionButtonDark}
                onPress={() => {
                  setForwardModalVisible(false);
                  setSelectedMessage(null);
                }}
              >
                <Ionicons name="close" size={21} color="white" />
                <Text style={styles.actionText}>Annuler</Text>
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
  forwardContactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    width: "100%",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#B135A3",
  },

  forwardContactText: {
    color: "#2B1B26",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 8,
  },
  mediaButton: {
    flexDirection: "row",
    backgroundColor: "#B135A3",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 8,
  },

  mediaButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 6,
  },

  mediaModalContainer: {
    flex: 1,
    backgroundColor: "#0005",
    justifyContent: "center",
    alignItems: "center",
  },

  mediaBox: {
    width: "92%",
    height: "78%",
    backgroundColor: "#FFF8FC",
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: "#B135A3",
  },

  closeMediaButton: {
    position: "absolute",
    right: 12,
    top: 10,
    zIndex: 10,
  },

  mediaTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2B1B26",
    textAlign: "center",
    marginBottom: 12,
  },

  mediaTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },

  mediaTab: {
    backgroundColor: "#B135A3",
    color: "white",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    margin: 3,
    fontSize: 12,
    fontWeight: "bold",
  },

  mediaItem: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#B135A3",
  },

  mediaImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },

  mediaText: {
    color: "#2B1B26",
    fontSize: 14,
    fontWeight: "bold",
  },
  actionButtonPin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8E44AD",
    width: "100%",
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 8,
  },
  pinnedText: {
    fontSize: 12,
    color: "#B135A3",
    fontWeight: "bold",
    marginTop: 5,
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
    color: "#0066cc",
    fontSize: 14,
    fontWeight: "bold",
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
  nicknameModalContainer: {
    flex: 1,
    backgroundColor: "#0005",
    justifyContent: "center",
    alignItems: "center",
  },

  nicknameBox: {
    width: "84%",
    backgroundColor: "#FFF8FC",
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: "#B135A3",
  },

  nicknameTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2B1B26",
    marginBottom: 14,
    textAlign: "center",
  },

  nicknameInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#B135A3",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    color: "#2B1B26",
    marginBottom: 14,
  },

  nicknameSaveButton: {
    backgroundColor: "#B135A3",
    height: 45,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  nicknameSaveText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  nicknameCancelButton: {
    marginTop: 10,
    alignItems: "center",
  },

  nicknameCancelText: {
    color: "#777",
    fontSize: 15,
    fontWeight: "bold",
  },
  voiceButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#6D2E5B",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },

  recordingButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#C62828",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },

  audioBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B135A3",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    minWidth: 150,
  },

  audioText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  audioWave: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },

  waveBar: {
    width: 3,
    height: 12,
    backgroundColor: "white",
    marginHorizontal: 1,
    borderRadius: 2,
  },
  systemMessageBox: {
    alignSelf: "center",
    backgroundColor: "#FFF8FC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#B135A3",
  },

  systemMessageText: {
    color: "#6D2E5B",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  nicknameOption: {
    width: "100%",
    backgroundColor: "#B135A3",
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },

  nicknameOptionText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
  fullScreenVideo: {
    width: "100%",
    height: "70%",
  },
});
