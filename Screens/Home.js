import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import MyAccount from "./Home/MyAccount";
import ListAccount from "./Home/ListAccount";
import Groupe from "./Home/Groupe";

export default function Home(props) {
  const userid = props.route.params.userid;
  const [page, setPage] = useState("MyAccount");

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {page === "MyAccount" && (
          <MyAccount
            navigation={props.navigation}
            route={{ params: { userid: userid } }}
          />
        )}

        {page === "ListAccount" && (
          <ListAccount
            navigation={props.navigation}
            route={{ params: { userid: userid } }}
          />
        )}

        {page === "Groupe" && <Groupe />}
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setPage("MyAccount")}
        >
          <Ionicons
            name="person"
            size={26}
            color={page === "MyAccount" ? "#07f" : "#fff"}
          />
          <Text style={styles.tabText}>Compte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setPage("ListAccount")}
        >
          <Ionicons
            name="people"
            size={26}
            color={page === "ListAccount" ? "#07f" : "#fff"}
          />
          <Text style={styles.tabText}>Contacts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setPage("Groupe")}
        >
          <Ionicons
            name="chatbubbles"
            size={26}
            color={page === "Groupe" ? "#07f" : "#fff"}
          />
          <Text style={styles.tabText}>Groupe</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
  },

  bottomBar: {
    height: 70,
    backgroundColor: "#0008",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  tabButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  tabText: {
    color: "#fff",
    fontSize: 13,
    marginTop: 3,
  },
});
