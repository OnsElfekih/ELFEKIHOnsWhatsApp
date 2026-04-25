import {
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import firebase from "../Config";
import { useEffect } from "react";
import { useState } from "react";
const database=firebase.database();
const ref_all_messages=database.ref("allmessages");

export default function Chat(props) {

    const currentid=props.route.params.currentid;
    const secondid=props.route.params.secondid;
    const [data, setdata] = useState([]);
    const [message, setMessage] = useState();
    const [secondistyping, setSecondistyping] = useState();
    
    const iddiscussion=
    currentid>secondid?currentid+secondid:secondid+currentid;
    const ref_discussion=ref_all_messages.child(iddiscussion);
    const ref_chat=ref_discussion.child("chat");
    const ref_second_istyping = ref_discussion.child(secondid + "istyping")

    useEffect(() => {
        //snapshot copie de ref_chat
        //on:kol matetbadl na9raha
      ref_chat.on("value",(snapshot)=>{
        var d=[];
        snapshot.forEach(one_message => {
          d.push(one_message.val());
        });
        setdata(d);
      });
      ref_second_istyping.on("value",(snapshot)=>{
        setSecondistyping(snapshot.val());
      })
    
      return () => {
        ref_chat.off();
        ref_second_istyping.off()
      }
    }, [])
  return (
    <ImageBackground
      style={styles.container}
      source={require("../assets/backgroundimg1.jpg")}
    >
      <Text>Chating</Text>
      <FlatList
        data={data}
        renderItem={({ item }) => {
          return (
            <View style={currentid==item.idsender?{backgroundColor: "red" }:{ backgroundColor: "blue" }}>
              <Text> {item.message}</Text>
              <Text> {item.time}</Text>
            </View>
          );
        }}
        style={{ width: "95%", backgroundColor: "#0003" }}
      ></FlatList>
      <View
        style={{
          height: 50,
          width: "100%",
          marginBottom: 50,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-evenly",
          borderRadius: 8,
        }}
      >
        {secondistyping && <Text>is typing ...</Text>}
        <TextInput
          onChangeText={(txt) => {
            setMessage(txt);
          }}
          onFocus={() => {
            const ref_me_istyping = ref_discussion.child(
            currentid + "istyping",
          );
          ref_me_istyping.set(true);
          }}
          
          onBlur={() => {
  const ref_me_istyping = ref_discussion.child(currentid + "istyping");
  ref_me_istyping.set(false);
}}
          placeholder="type message"
          style={{ backgroundColor: "#00f4", width: "75%" }}
        ></TextInput>
        <TouchableOpacity onPress={() => {
            const key=ref_chat.push().key;
            const ref_un_message=ref_chat.child(key);
            ref_un_message.set({
                idsender: currentid,
                idreceiver: secondid,
                message,
                time: new Date().toLocaleString()
            })
        }}>
          <Image
            source={require("../assets/sendmsg.png")}
            style={{ width: 25, height: 25 }}
          ></Image>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});