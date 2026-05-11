import {
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  Linking,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useEffect, useState } from "react";
import firebase from "../../Config";

const database = firebase.database();
const ref_all_accounts = database.ref("allaccounts");
const ref_all_messages = database.ref("allmessages");

export default function ListAccount(props) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState();
  const [data, setdata] = useState([]);
  const [search, setSearch] = useState("");
  const [allData, setAllData] = useState([]);

  const userid = props.route.params.userid;

  useEffect(() => {
    ref_all_accounts.on("value", (snapshot) => {
      var d = [];

      snapshot.forEach((one_account) => {
        if (one_account.val().Id !== userid) {
          const otherUser = one_account.val();

          const iddiscussion =
            userid > otherUser.Id
              ? userid + otherUser.Id
              : otherUser.Id + userid;

          ref_all_messages
            .child(iddiscussion)
            .child("nicknames")
            .child(otherUser.Id)
            .once("value")
            .then((nicknameSnapshot) => {
              d.push({
                ...otherUser,
                Nickname: nicknameSnapshot.val() || "",
              });

              setdata([...d]);
              setAllData([...d]);
            });
        }
      });

      setdata(d);
      setAllData(d);
    });

    return () => {
      ref_all_accounts.off();
    };
  }, []);
  const searchContact = (txt) => {
    setSearch(txt);

    const value = txt.toLowerCase();

    if (value.trim() === "") {
      setdata(allData);
      return;
    }

    const result = allData.filter((item) => {
      const nom = String(item.Nom || "").toLowerCase();
      const nickname = String(item.Nickname || "").toLowerCase();
      const pseudo = String(item.Pseudo || "").toLowerCase();
      const email = String(item.Email || "").toLowerCase();
      const numero = String(item.Numero || "").toLowerCase();

      return (
        nom.includes(value) ||
        nickname.includes(value) ||
        pseudo.includes(value) ||
        email.includes(value) ||
        numero.includes(value)
      );
    });

    setdata(result);
  };
  return (
    <ImageBackground
      style={styles.container}
      source={require("../../assets/backgroundimg1.jpg")}
    >
      <Text style={styles.title}>Liste des contacts</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#B135A3" />

        <TextInput
          value={search}
          onChangeText={(txt) => {
            searchContact(txt);
          }}
          placeholder="Rechercher nom, surnom, email, téléphone..."
          placeholderTextColor="#777"
          style={styles.searchInput}
        />
      </View>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          return (
            <View style={styles.card}>
              <TouchableOpacity
                onPress={() => {
                  setIsModalVisible(true);
                  setSelectedUser(item);
                }}
              >
                <Image
                  style={styles.profileImage}
                  source={
                    item.UrlImage
                      ? { uri: item.UrlImage }
                      : require("../../assets/profil.png")
                  }
                />
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Text style={styles.name}>
                  {item.Nickname ? item.Nickname : item.Nom}
                </Text>
                <Text style={styles.pseudo}>{item.Pseudo}</Text>
                <Text style={styles.email}>{item.Email}</Text>
                <Text style={styles.numero}>{item.Numero}</Text>
              </View>

              <View style={styles.actionsBox}>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => {
                    Linking.openURL(`tel:${item.Numero}`);
                  }}
                >
                  <Ionicons name="call" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smsButton}
                  onPress={() => {
                    Linking.openURL(`sms:${item.Numero}`);
                  }}
                >
                  <Ionicons name="chatbox-ellipses" size={18} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.emailButton}
                  onPress={() => {
                    Linking.openURL(`mailto:${item.Email}`);
                  }}
                >
                  <Ionicons name="mail" size={18} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={() => {
                    props.navigation.navigate("Chat", {
                      currentid: userid,
                      secondid: item.Id,
                    });
                  }}
                >
                  <Ionicons name="chatbubble" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        style={styles.list}
      />

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Image
              source={
                selectedUser?.UrlImage
                  ? { uri: selectedUser.UrlImage }
                  : require("../../assets/profil.png")
              }
              style={styles.modalImage}
            />
            <Text style={styles.modalPseudo}>{selectedUser?.Pseudo}</Text>
            <Text style={styles.modalText}>
              {selectedUser?.Nickname
                ? selectedUser?.Nickname
                : selectedUser?.Nom}
            </Text>
            <Text style={styles.modalText}>{selectedUser?.Numero}</Text>
            <Text style={styles.modalText}>{selectedUser?.Email}</Text>

            <Pressable
              onPress={() => {
                setIsModalVisible(false);
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>Fermer</Text>
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
    alignItems: "center",
    paddingTop: 35,
  },
  smsButton: {
    backgroundColor: "#8E44AD",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "bold",
    fontSize: 28,
    color: "#B135A3",
    marginBottom: 12,
  },

  list: {
    width: "95%",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#ffffffcc",
    marginBottom: 10,
    padding: 10,
    borderRadius: 14,
    alignItems: "center",
  },

  profileImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: "#B135A3",
  },

  infoBox: {
    flex: 1,
    marginLeft: 10,
  },

  name: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2B1B26",
  },

  pseudo: {
    fontSize: 13,
    color: "#B135A3",
    marginTop: 2,
  },

  email: {
    fontSize: 12,
    color: "#333",
    marginTop: 2,
  },

  numero: {
    fontSize: 12,
    color: "#333",
    marginTop: 2,
  },

  actionsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  callButton: {
    backgroundColor: "#3B1D33",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  emailButton: {
    backgroundColor: "#6D2E5B",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  chatButton: {
    backgroundColor: "#B135A3",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#0008",
    alignItems: "center",
    justifyContent: "center",
  },

  modalBox: {
    width: "82%",
    backgroundColor: "#ffffffee",
    borderRadius: 18,
    alignItems: "center",
    padding: 18,
  },

  modalImage: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 3,
    borderColor: "#B135A3",
    marginBottom: 12,
  },

  modalPseudo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2B1B26",
    marginBottom: 5,
  },

  modalText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },

  closeButton: {
    width: 150,
    height: 45,
    backgroundColor: "#B135A3",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    marginTop: 14,
  },

  closeText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  searchBox: {
    width: "95%",
    height: 45,
    backgroundColor: "#FFF8FC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#B135A3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#2B1B26",
    fontSize: 14,
  },
});
