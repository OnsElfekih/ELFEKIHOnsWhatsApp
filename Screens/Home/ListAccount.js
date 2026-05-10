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
} from "react-native";

import { useEffect, useState } from "react";
import firebase from "../../Config";

const database = firebase.database();
const ref_all_accounts = database.ref("allaccounts");

export default function ListAccount(props) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState();
  const [data, setdata] = useState([]);

  const userid = props.route.params.userid;

  useEffect(() => {
    ref_all_accounts.on("value", (snapshot) => {
      var d = [];

      snapshot.forEach((one_account) => {
        if (one_account.val().Id !== userid) {
          d.push(one_account.val());
        }
      });

      setdata(d);
    });

    return () => {
      ref_all_accounts.off();
    };
  }, []);

  return (
    <ImageBackground
      style={styles.container}
      source={require("../../assets/backgroundimg1.jpg")}
    >
      <Text style={styles.title}>Liste des contacts</Text>

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
                <Text style={styles.name}>{item.Nom}</Text>
                <Text style={styles.pseudo}>@{item.Pseudo}</Text>
                <Text style={styles.email}>{item.Email}</Text>
                <Text style={styles.numero}>{item.Numero}</Text>
              </View>

              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => {
                  props.navigation.navigate("Chat", {
                    currentid: userid,
                    secondid: item.Id,
                  });
                }}
              >
                <Image
                  style={styles.chatIcon}
                  source={require("../../assets/sendmsg.png")}
                />
              </TouchableOpacity>
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

            <Text style={styles.modalName}>{selectedUser?.Nom}</Text>
            <Text style={styles.modalText}>@{selectedUser?.Pseudo}</Text>
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
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "#B135A3",
  },

  infoBox: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2B1B26",
  },

  pseudo: {
    fontSize: 14,
    color: "#B135A3",
    marginTop: 2,
  },

  email: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
  },

  numero: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
  },

  chatButton: {
    backgroundColor: "#B135A3",
    width: 45,
    height: 45,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  chatIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
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

  modalName: {
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
});
