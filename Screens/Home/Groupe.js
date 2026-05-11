import {
  FlatList,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import firebase from "../../Config";

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
  return (
    <ImageBackground
      source={require("../../assets/backgroundimg1.jpg")}
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

            <Text style={styles.chatTitle}>{selectedGroup.name}</Text>
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
                    <Text
                      style={
                        item.idsender === "system"
                          ? styles.systemText
                          : styles.messageText
                      }
                    >
                      {String(item.message || "")}
                    </Text>

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

            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendGroupMessage}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
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
});
