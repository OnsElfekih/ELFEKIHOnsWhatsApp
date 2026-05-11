import {
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import firebase from "../../Config";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../Config";
import * as Location from "expo-location";
import { Video, Audio } from "expo-av";

const auth = firebase.auth();
const database = firebase.database();
const ref_all_accounts = database.ref("allaccounts");
const ref_all_groups = database.ref("allgroups");

export default function Groupe(props) {
  const userid = props.route?.params?.userid || auth.currentUser?.uid;
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);

  const [groupName, setGroupName] = useState("");
  const [groupModalVisible, setGroupModalVisible] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [message, setMessage] = useState("");

  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);

  const [myAccount, setMyAccount] = useState(null);

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [availableContacts, setAvailableContacts] = useState([]);

  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [mediaType, setMediaType] = useState("images");
  const [groupBackground, setGroupBackground] = useState(null);

  const [groupNameModalVisible, setGroupNameModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const [recording, setRecording] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);

  useEffect(() => {
    if (!userid) return;

    ref_all_accounts.on("value", (snapshot) => {
      const d = [];

      snapshot.forEach((one_account) => {
        const account = one_account.val();

        if (account.Id === userid) {
          setMyAccount(account);
        } else {
          d.push(account);
        }
      });

      setContacts(d);
    });

    ref_all_groups.on("value", (snapshot) => {
      const d = [];

      snapshot.forEach((one_group) => {
        const group = one_group.val();

        if (group.members && group.members[userid]) {
          d.push({
            key: one_group.key,
            ...group,
          });
        }
      });

      setGroups(d);
    });

    return () => {
      ref_all_accounts.off();
      ref_all_groups.off();
    };
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;

    const ref_background = ref_all_groups
      .child(selectedGroup.key)
      .child("background");

    ref_background.on("value", (snapshot) => {
      setGroupBackground(snapshot.val());
    });

    const ref_messages = ref_all_groups
      .child(selectedGroup.key)
      .child("messages");

    ref_messages.on("value", (snapshot) => {
      const d = [];

      snapshot.forEach((one_message) => {
        d.push({
          key: one_message.key,
          ...one_message.val(),
        });
      });

      setGroupMessages(d);
    });

    return () => {
      ref_messages.off();
      ref_background.off();
    };
  }, [selectedGroup]);

  const toggleContact = (contact) => {
    const exists = selectedContacts.find((item) => item.Id === contact.Id);

    if (exists) {
      setSelectedContacts(
        selectedContacts.filter((item) => item.Id !== contact.Id),
      );
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const createGroup = () => {
    if (!groupName.trim()) {
      Alert.alert("Erreur", "Donner un nom au groupe.");
      return;
    }

    if (selectedContacts.length < 2) {
      Alert.alert("Erreur", "Choisir au moins deux contacts.");
      return;
    }

    const members = {};
    members[userid] = true;

    selectedContacts.forEach((contact) => {
      members[contact.Id] = true;
    });

    ref_all_groups.push().set({
      name: groupName,
      creator: userid,
      members: members,
      createdAt: new Date().toLocaleString(),
    });

    setGroupName("");
    setSelectedContacts([]);
    setGroupModalVisible(false);
  };

  const sendGroupMessage = () => {
    if (!selectedGroup || !message.trim()) return;

    ref_all_groups
      .child(selectedGroup.key)
      .child("messages")
      .push()
      .set({
        idsender: userid,
        message: message.trim(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

    setMessage("");
  };
  const openMembersModal = () => {
    if (!selectedGroup) return;

    const membersList = contacts.filter(
      (contact) => selectedGroup.members && selectedGroup.members[contact.Id],
    );

    setGroupMembers(membersList);
    setMembersModalVisible(true);
  };
  const removeMember = (member) => {
    if (!selectedGroup || selectedGroup.creator !== userid) {
      Alert.alert("Erreur", "Seul l'administrateur peut exclure un membre.");
      return;
    }

    Alert.alert(
      "Confirmation",
      "Voulez-vous exclure " +
        (member.Nom || member.Pseudo || member.Email) +
        " du groupe ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Exclure",
          style: "destructive",
          onPress: () => {
            ref_all_groups
              .child(selectedGroup.key)
              .child("members")
              .child(member.Id)
              .remove();

            ref_all_groups
              .child(selectedGroup.key)
              .child("messages")
              .push()
              .set({
                idsender: "system",
                message:
                  (member.Nom || member.Pseudo || member.Email) +
                  " a été exclu du groupe",
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              });

            setGroupMembers(
              groupMembers.filter((item) => item.Id !== member.Id),
            );
          },
        },
      ],
    );
  };
  const deleteGroup = () => {
    if (!selectedGroup || selectedGroup.creator !== userid) {
      Alert.alert("Erreur", "Seul l'administrateur peut supprimer le groupe.");
      return;
    }

    Alert.alert(
      "Confirmation",
      "Voulez-vous supprimer le groupe " + selectedGroup.name + " ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            ref_all_groups.child(selectedGroup.key).remove();

            setSelectedGroup(null);
            setGroupMessages([]);
            setMembersModalVisible(false);
          },
        },
      ],
    );
  };
  const leaveGroup = () => {
    if (!selectedGroup) return;

    const leavingName =
      myAccount?.Nom ||
      myAccount?.Pseudo ||
      myAccount?.Email ||
      auth.currentUser?.email ||
      "Un membre";

    if (selectedGroup.creator === userid) {
      Alert.alert(
        "Confirmation",
        "Vous êtes admin. Si vous quittez, le groupe sera supprimé complètement.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Quitter et supprimer",
            style: "destructive",
            onPress: () => {
              ref_all_groups.child(selectedGroup.key).remove();

              setSelectedGroup(null);
              setGroupMessages([]);
              setMembersModalVisible(false);
            },
          },
        ],
      );
    } else {
      Alert.alert("Confirmation", "Voulez-vous quitter le groupe ?", [
        { text: "Annuler", style: "cancel" },
        {
          text: "Quitter",
          style: "destructive",
          onPress: () => {
            ref_all_groups
              .child(selectedGroup.key)
              .child("members")
              .child(userid)
              .remove();

            ref_all_groups
              .child(selectedGroup.key)
              .child("messages")
              .push()
              .set({
                idsender: "system",
                message: leavingName + " a quitté le groupe",
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              });

            setSelectedGroup(null);
            setGroupMessages([]);
            setMembersModalVisible(false);
          },
        },
      ]);
    }
  };
  const openInviteModal = () => {
    if (!selectedGroup) return;

    const available = contacts.filter(
      (contact) => !selectedGroup.members || !selectedGroup.members[contact.Id],
    );

    setAvailableContacts(available);
    setInviteModalVisible(true);
  };

  const inviteMember = (contact) => {
    if (!selectedGroup) return;

    ref_all_groups
      .child(selectedGroup.key)
      .child("members")
      .child(contact.Id)
      .set(true);

    ref_all_groups
      .child(selectedGroup.key)
      .child("messages")
      .push()
      .set({
        idsender: "system",
        message:
          (contact.Nom || contact.Pseudo || contact.Email) +
          " a été ajouté au groupe",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

    setAvailableContacts(
      availableContacts.filter((item) => item.Id !== contact.Id),
    );
    setGroupMembers([...groupMembers, contact]);
  };
  const getSenderName = () => {
    return (
      myAccount?.Nom ||
      myAccount?.Pseudo ||
      myAccount?.Email ||
      auth.currentUser?.email ||
      "Un membre"
    );
  };
  const uploadFileToSupabase = async (url, type = "image") => {
    try {
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

      const filename = Date.now() + extension;

      const { error } = await supabase.storage
        .from("images")
        .upload(filename, arraybuffer, {
          contentType: contentType,
          upsert: true,
        });

      if (error) {
        Alert.alert("Erreur upload", error.message);
        return null;
      }

      const { data } = supabase.storage.from("images").getPublicUrl(filename);

      return data.publicUrl;
    } catch (e) {
      Alert.alert("Erreur", e.message);
      return null;
    }
  };
  const sendGroupMedia = (data) => {
    if (!selectedGroup) return;

    ref_all_groups
      .child(selectedGroup.key)
      .child("messages")
      .push()
      .set({
        idsender: userid,
        ...data,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const link = await uploadFileToSupabase(asset.uri, "image");

      if (link) {
        sendGroupMedia({ imageUrl: link });
      }
    }
  };

  const pickVideo = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const link = await uploadFileToSupabase(asset.uri, "video");

      if (link) {
        sendGroupMedia({ videoUrl: link });
      }
    }
  };
  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    });

    if (!result.canceled) {
      const link = await uploadFileToSupabase(result.assets[0].uri, "image");
      if (link) sendGroupMedia({ imageUrl: link });
    }
  };

  const openVideoCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.5,
      videoMaxDuration: 30,
    });

    if (!result.canceled) {
      const link = await uploadFileToSupabase(result.assets[0].uri, "video");
      if (link) sendGroupMedia({ videoUrl: link });
    }
  };

  const sendLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") return;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    sendGroupMedia({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      isLocation: true,
    });
  };

  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();

    if (!permission.granted) return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );

    setRecording(recording);
  };

  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();
    setRecording(null);

    const link = await uploadFileToSupabase(uri, "audio");

    if (link) sendGroupMedia({ audioUrl: link });
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
    }
  };
  const changeGroupBackground = async () => {
    if (!selectedGroup) return;

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

      if (!link) return;

      ref_all_groups.child(selectedGroup.key).child("background").set(link);

      ref_all_groups
        .child(selectedGroup.key)
        .child("messages")
        .push()
        .set({
          idsender: "system",
          message: getSenderName() + " a changé le fond de la conversation",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
    }
  };

  const getGroupMedia = () => {
    if (mediaType === "images") {
      return groupMessages.filter((item) => item.imageUrl);
    }

    if (mediaType === "videos") {
      return groupMessages.filter((item) => item.videoUrl);
    }

    if (mediaType === "links") {
      return groupMessages.filter((item) => {
        const msg = String(item.message || "");
        return msg.includes("http://") || msg.includes("https://");
      });
    }

    if (mediaType === "pinned") {
      return groupMessages.filter((item) => item.pinned);
    }

    if (mediaType === "locations") {
      return groupMessages.filter((item) => item.isLocation);
    }

    if (mediaType === "audios") {
      return groupMessages.filter((item) => item.audioUrl);
    }

    return [];
  };
  const changeGroupName = () => {
    if (!selectedGroup || !newGroupName.trim()) return;

    const oldName = selectedGroup.name;
    const finalName = newGroupName.trim();

    ref_all_groups.child(selectedGroup.key).update({
      name: finalName,
    });

    ref_all_groups
      .child(selectedGroup.key)
      .child("messages")
      .push()
      .set({
        idsender: "system",
        message:
          getSenderName() +
          " a changé le nom du groupe de " +
          oldName +
          " en " +
          finalName,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

    setSelectedGroup({
      ...selectedGroup,
      name: finalName,
    });

    setNewGroupName("");
    setGroupNameModalVisible(false);
  };
  return (
    <ImageBackground
      source={
        groupBackground
          ? { uri: groupBackground }
          : require("../../assets/backgroundimg1.jpg")
      }
      style={styles.container}
    >
      {!selectedGroup ? (
        <>
          <Text style={styles.title}>Groupes</Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setGroupModalVisible(true);
            }}
          >
            <Ionicons name="add" size={22} color="white" />
            <Text style={styles.addText}>Créer un groupe</Text>
          </TouchableOpacity>

          <FlatList
            data={groups}
            keyExtractor={(item) => item.key}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.groupCard}
                onPress={() => {
                  setSelectedGroup(item);
                }}
              >
                <Ionicons name="people" size={26} color="#B135A3" />

                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  <Text style={styles.groupDetails}>Discussion de groupe</Text>
                </View>

                <Ionicons name="chevron-forward" size={22} color="#777" />
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <>
          <View style={styles.chatHeader}>
            <TouchableOpacity
              onPress={() => {
                setSelectedGroup(null);
                setGroupMessages([]);
              }}
            >
              <Ionicons name="arrow-back" size={26} color="#2B1B26" />
            </TouchableOpacity>

            <TouchableOpacity
              onLongPress={() => {
                setNewGroupName(selectedGroup.name);
                setGroupNameModalVisible(true);
              }}
            >
              <Text style={styles.chatTitle}>{selectedGroup.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openMembersModal}
              style={styles.membersButton}
            >
              <Ionicons name="people" size={22} color="#B135A3" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={leaveGroup}
              style={styles.leaveGroupButton}
            >
              <Ionicons name="exit" size={20} color="white" />
            </TouchableOpacity>
            {selectedGroup?.creator === userid && (
              <TouchableOpacity
                onPress={deleteGroup}
                style={styles.deleteGroupButton}
              >
                <Ionicons name="trash" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.groupOptionsBox}>
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
              onPress={changeGroupBackground}
            >
              <Ionicons name="image" size={20} color="white" />
              <Text style={styles.mediaButtonText}>Changer le fond</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={groupMessages}
            keyExtractor={(item) => item.key}
            style={styles.messagesList}
            renderItem={({ item }) => {
              const isSender = item.idsender === userid;

              return (
                <View
                  style={[
                    styles.messageWrapper,
                    isSender ? styles.senderWrapper : styles.receiverWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isSender ? styles.senderBubble : styles.receiverBubble,
                    ]}
                  >
                    {item.idsender !== userid && item.idsender !== "system" && (
                      <Text style={styles.senderName}>
                        {contacts.find((c) => c.Id === item.idsender)?.Nom ||
                          contacts.find((c) => c.Id === item.idsender)
                            ?.Pseudo ||
                          contacts.find((c) => c.Id === item.idsender)?.Email ||
                          "Membre"}
                      </Text>
                    )}
                    {item.audioUrl ? (
                      <TouchableOpacity
                        style={styles.audioBox}
                        onPress={() =>
                          playAudioMessage(item.audioUrl, item.key)
                        }
                      >
                        <Ionicons
                          name={
                            playingAudio === item.key ? "volume-high" : "play"
                          }
                          size={22}
                          color="white"
                        />
                        <Text style={styles.audioText}>Message vocal</Text>
                      </TouchableOpacity>
                    ) : item.videoUrl ? (
                      <Video
                        source={{ uri: String(item.videoUrl) }}
                        style={styles.video}
                        useNativeControls
                        resizeMode="contain"
                      />
                    ) : item.imageUrl ? (
                      <Image
                        source={{ uri: String(item.imageUrl) }}
                        style={styles.messageImage}
                      />
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
                      <Text
                        style={
                          item.idsender === "system"
                            ? styles.systemText
                            : styles.messageText
                        }
                      >
                        {String(item.message || "")}
                      </Text>
                    )}

                    <Text style={styles.timeText}>
                      {String(item.time || "")}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.inputContainer}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Écrire un message..."
              placeholderTextColor="#777"
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
                style={styles.iconButton}
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
                style={styles.sendButton}
                onPress={sendGroupMessage}
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <Modal visible={groupModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Nouveau groupe</Text>

            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Nom du groupe"
              placeholderTextColor="#777"
              style={styles.groupInput}
            />

            <Text style={styles.selectTitle}>Choisir les contacts</Text>

            <FlatList
              data={contacts}
              keyExtractor={(item, index) => index.toString()}
              style={styles.contactsList}
              renderItem={({ item }) => {
                const selected = selectedContacts.find(
                  (contact) => contact.Id === item.Id,
                );

                return (
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => {
                      toggleContact(item);
                    }}
                  >
                    <Ionicons
                      name={selected ? "checkbox" : "square-outline"}
                      size={22}
                      color="#B135A3"
                    />

                    <Text style={styles.contactName}>
                      {item.Nom || item.Pseudo || item.Email}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <Pressable style={styles.createButton} onPress={createGroup}>
              <Text style={styles.createText}>Créer</Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setGroupModalVisible(false);
              }}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={membersModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Membres du groupe</Text>

            <FlatList
              data={groupMembers}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.memberRow}>
                  <Text style={styles.memberName}>
                    {item.Nom || item.Pseudo || item.Email}
                  </Text>

                  {selectedGroup?.creator === userid && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeMember(item)}
                    >
                      <Ionicons name="person-remove" size={18} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
            <Pressable style={styles.inviteButton} onPress={openInviteModal}>
              <Ionicons name="person-add" size={18} color="white" />
              <Text style={styles.inviteText}>Inviter un contact</Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setMembersModalVisible(false)}
            >
              <Text style={styles.cancelText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={inviteModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Inviter un contact</Text>

            <FlatList
              data={availableContacts}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.memberRow}>
                  <Text style={styles.memberName}>
                    {item.Nom || item.Pseudo || item.Email}
                  </Text>

                  <TouchableOpacity
                    style={styles.inviteSmallButton}
                    onPress={() => inviteMember(item)}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            />

            <Pressable
              style={styles.cancelButton}
              onPress={() => setInviteModalVisible(false)}
            >
              <Text style={styles.cancelText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={mediaModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Médias partagés</Text>

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
              data={getGroupMedia()}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.mediaItem}
                  onPress={() => {
                    if (item.isLocation) {
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
                      <Text style={styles.audioText}>Message vocal</Text>
                    </TouchableOpacity>
                  ) : item.videoUrl ? (
                    <Video
                      source={{ uri: String(item.videoUrl) }}
                      style={styles.mediaVideo}
                      useNativeControls
                      resizeMode="contain"
                    />
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
                    <Text style={styles.mediaText}>
                      {String(item.message || "")}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />

            <Pressable
              style={styles.cancelButton}
              onPress={() => setMediaModalVisible(false)}
            >
              <Text style={styles.cancelText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={groupNameModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Modifier le nom du groupe</Text>

            <TextInput
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Nouveau nom du groupe"
              placeholderTextColor="#777"
              style={styles.groupInput}
            />

            <Pressable style={styles.createButton} onPress={changeGroupName}>
              <Text style={styles.createText}>Enregistrer</Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setGroupNameModalVisible(false)}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 35,
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#B135A3",
    marginBottom: 12,
  },

  addButton: {
    flexDirection: "row",
    backgroundColor: "#B135A3",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 12,
  },

  addText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 6,
  },

  list: {
    width: "95%",
  },

  groupCard: {
    flexDirection: "row",
    backgroundColor: "#ffffffcc",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: "center",
  },

  groupInfo: {
    flex: 1,
    marginLeft: 12,
  },

  groupName: {
    color: "#2B1B26",
    fontSize: 17,
    fontWeight: "bold",
  },

  groupDetails: {
    color: "#777",
    fontSize: 13,
    marginTop: 2,
  },

  chatHeader: {
    width: "95%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8FC",
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
  },

  chatTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2B1B26",
    marginLeft: 12,
  },

  messagesList: {
    width: "100%",
    flex: 1,
  },

  messageWrapper: {
    width: "100%",
    paddingHorizontal: 10,
    marginVertical: 6,
    flexDirection: "row",
  },

  senderWrapper: {
    justifyContent: "flex-end",
  },

  receiverWrapper: {
    justifyContent: "flex-start",
  },

  messageBubble: {
    maxWidth: "78%",
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 16,
  },

  senderBubble: {
    backgroundColor: "#F7D9F1",
    borderWidth: 1,
    borderColor: "#B135A3",
  },

  receiverBubble: {
    backgroundColor: "#FFF8FC",
    borderLeftWidth: 3,
    borderLeftColor: "#B135A3",
  },

  messageText: {
    color: "#2B1B26",
    fontSize: 15,
    fontWeight: "500",
  },

  timeText: {
    color: "#6D2E5B",
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
    fontWeight: "bold",
  },

  inputContainer: {
    width: "96%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0006",
    borderRadius: 25,
    padding: 7,
    marginBottom: 8,
  },

  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#FFF8FC",
    borderRadius: 20,
    paddingHorizontal: 12,
    color: "#2B1B26",
    borderWidth: 1,
    borderColor: "#B135A3",
  },

  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#B135A3",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#0008",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "88%",
    maxHeight: "85%",
    backgroundColor: "#FFF8FC",
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: "#B135A3",
  },

  modalTitle: {
    color: "#2B1B26",
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },

  groupInput: {
    height: 45,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#B135A3",
    paddingHorizontal: 10,
    marginBottom: 12,
    color: "#2B1B26",
  },

  selectTitle: {
    color: "#B135A3",
    fontWeight: "bold",
    marginBottom: 8,
  },

  contactsList: {
    maxHeight: 260,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },

  contactName: {
    marginLeft: 10,
    color: "#2B1B26",
    fontSize: 15,
    fontWeight: "bold",
  },

  createButton: {
    backgroundColor: "#B135A3",
    height: 43,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  createText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  cancelButton: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  cancelText: {
    color: "#777",
    fontSize: 15,
    fontWeight: "bold",
  },
  membersButton: {
    marginLeft: "auto",
    backgroundColor: "#FFF8FC",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#B135A3",
  },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#B135A3",
  },

  memberName: {
    flex: 1,
    color: "#2B1B26",
    fontSize: 15,
    fontWeight: "bold",
  },

  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#C62828",
    alignItems: "center",
    justifyContent: "center",
  },
  systemText: {
    color: "#6D2E5B",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  deleteGroupButton: {
    marginLeft: 8,
    backgroundColor: "#C62828",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveGroupButton: {
    marginLeft: 8,
    backgroundColor: "#6D2E5B",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteButton: {
    flexDirection: "row",
    height: 42,
    backgroundColor: "#B135A3",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginTop: 10,
  },

  inviteText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 6,
  },

  inviteSmallButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#B135A3",
    alignItems: "center",
    justifyContent: "center",
  },
  senderName: {
    color: "#B135A3",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
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

  mediaText: {
    color: "#2B1B26",
    fontSize: 14,
    fontWeight: "bold",
  },
  groupOptionsBox: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
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
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF8FC",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  voiceButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#6D2E5B",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  recordingButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#C62828",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  messageImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 4,
  },

  video: {
    width: 220,
    height: 220,
    borderRadius: 10,
    marginBottom: 4,
  },

  audioBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B135A3",
    padding: 10,
    borderRadius: 18,
  },

  audioText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },

  locationText: {
    color: "#0066cc",
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 5,
  },
  mediaImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },

  mediaVideo: {
    width: 220,
    height: 220,
    borderRadius: 10,
    marginBottom: 4,
  },

  audioBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B135A3",
    padding: 10,
    borderRadius: 18,
  },

  audioText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
});
