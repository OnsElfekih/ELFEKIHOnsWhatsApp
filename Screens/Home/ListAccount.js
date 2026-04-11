import {
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useEffect, useState } from "react";
import firebase from "../../Config";
const database=firebase.database();
const ref_all_accounts=database.ref("allaccounts");

export default function ListAccount() {
  const [data, setdata] = useState([])

  useEffect(() => {
      ref_all_accounts.on("value",(snapshot)=>{
      var d=[];
      snapshot.forEach(one_account => {
        d.push(one_account.val());
      });
    setdata(d);
  });
  
    return () => {
      ref_all_accounts.off();
    }
  }, [])
  

  return (
    <ImageBackground
      style={styles.container}
      source={require("../../assets/backgroundimg1.jpg")}
    >
      <Text
        style={{
          fontWeight: "bold",
          fontSize: 26,
        }}
      >
        ListAccount
      </Text>
      <FlatList
        data={data}
        renderItem={({ item }) => {
          return (
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "gray",
                marginBottom: 3,
              }}
            >
              <Image
                style={{ width: 50, height: 50 }}
                source={require("../../assets/profil.png")}
              ></Image>
              <Text> {item.Nom} </Text>
              <Text> {item.Pseudo} </Text>
            </View>
          );
        }}
        style={{
          backgroundColor: "#0003",
          width: "95%",
        }}
      ></FlatList>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    marginTop: 30,
  },
});