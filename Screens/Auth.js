import { StatusBar } from 'expo-status-bar';
import { Button, ImageBackground, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Auth(props) {
  return (
    <ImageBackground source={require("../assets/backgroundimg1.jpg")} style={styles.container}>
      <View style={styles.view}>
      <Text style={styles.text}>Welcome!</Text>
      <TextInput style={styles.input} placeholder="email@address.com"></TextInput>
      <TextInput style={styles.input} placeholder="**password**"></TextInput>
      <Button onPress={()=>{props.navigation.navigate('Home')}} title="Submit" color="#b135a3"></Button>
      <Text onPress={()=>{props.navigation.navigate('SignUp')}}>Create a new account</Text>
      </View>
      <StatusBar style="auto" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#785274',
    alignItems: 'center', //align horizontal
    justifyContent: 'center', //align vertical
  },
  text: {
    backgroundColor: '#786852',
    color: 'white',
    fontSize: 30,
    padding: 10,
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'white',
    width: "95%",
    height: 45,
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 7,
    textAlign: 'center',
  },
  view: {
    backgroundColor: '#0004',
    width: "90%",
    height: 300,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  } 
});
