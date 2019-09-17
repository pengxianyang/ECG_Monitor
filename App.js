// In App.js in a new project
import React ,{Component} from 'react';
import {
    TextInput,
    Alert,
    Button,
    View,
    Text,
    StyleSheet,
    Animated,
    Image,
    FlatList,
    Platform,
    TouchableOpacity,
    AppRegistry,
    StatusBar,
} from 'react-native';
import {
    createAppContainer
} from 'react-navigation';
import {
    createStackNavigator
} from 'react-navigation-stack';
import LoginScreen from './src/components/LoginScreen';
import BluetoothScreen from './src/components/BluetoothScreen'


class HomeScreen extends React.Component {

    _onPressButton() {
        var x = 100;
        var s = x.toString();

        Alert.alert(s);
    }

    state = {
        text: '',
        num: 0,
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.buttonContainer}>
                    <Button
                        onPress={() => this.props.navigation.navigate('Details',
                            {
                                itemid:100,//页面之间传递的参数
                                text:this.state.Text,
                                otherParam:'this is other param',
                            })
                        }
                        title="go to detail page"
                    />
                </View>
                <View style={styles.buttonContainer}>
                    <Button
                        onPress={() => this.props.navigation.navigate('NetWorkTest',
                            {
                                itemid:101,//页面之间传递的参数
                                url:'this is other param',
                            })
                        }
                        title="go to network test"
                    />
                </View>
                <View style={styles.buttonContainer}>
                    <Button
                        onPress={() => this.props.navigation.navigate('BLEModule',
                            {
                                itemid:102,//页面之间传递的参数
                                url:'this is other param',
                            })
                        }
                        title="go to ble test"
                    />
                </View>
                <View style={styles.alternativeLayoutButtonContainer}>
                    <Button
                        onPress={this._onPressButton}
                        title="left button"
                        color="#FF00FF"
                    />
                    <Button
                        onPress={this._onPressButton}
                        title="right button"
                        color="#FF00FF"
                    />
                </View>

            </View>
        );
    }
}

class NetWorkTest extends React.Component {

    state = {
        userlocation: "unknow userlocation",
        userip: "0000",
        loaded: false,
    }

    //生命周期开始的时候调用一次，此后不再调用
    componentDidMount() {
        this.getFetch();
    }

    getFetch() {
        //'http://ip-api.com/json'
        //http://106.54.62.64:8080/test/entity
        return fetch('http://ip-api.com/json')
            .then(function(response) {
                console.log(response.status);
                return response.json();
            })
            .then(function(data) {
                //Alert.alert(data.country);
                console.log(data.country);
                this.setState({
                    userip: data.query,
                    userlocation: data.country,
                    company: data.org,
                    loaded: true,
                    age:data.age,
                    height:data.height,
                });
                return data;
            }.bind(this))
            .catch((error) => {
                console.error(error);
            });
    }

    constructor(props) {
        super(props);
        this.state = {
            userlocation: "unknow userlocation",
            userip: "0000",
            company: "unknow company",
            loaded: false,
        }
        this.getFetch = this.getFetch.bind(this);
    }

    render() {
        if (!this.state.loaded) {
            return this.randerLoadingView();
        }
        return this.renderdone();
    }

    randerLoadingView() {
        return (
            <View style={styles.ImageContainer}>
                <Image
                    source={require('./res/Image/loading.gif')}
                    style={styles.simpleImage}
                />
            </View>
        );
    }

    renderdone() {
        const {
            navigation
        } = this.props;
        const itemID = navigation.getParam('itemid', 'No-id');
        const url = navigation.getParam('url', 'www.baidu.com');

        return (
            <View style={styles.container}>
                <Text style={styles.biggerfont}>{this.state.userlocation}</Text>
                <Text style={styles.biggerfont}>{this.state.userip}</Text>
                <Text style={styles.biggerfont}>{this.state.company}</Text>
                <Text style={styles.biggerfont}>{this.state.age}</Text>
                <Text style={styles.biggerfont}>{this.state.height}</Text>
                <View style={styles.buttonContainer}>
                    <Button
                        title="Fetch"
                        onPress={()=>{
                            this.getFetch();
                        }}
                    />
                </View>
                <View style={styles.buttonContainer}>
                    <Button
                        title="Back Home"
                        onPress={() => this.props.navigation.navigate('Home')}
                    />
                </View>
            </View>
        );
    }
}

class DetailsScreen extends React.Component {
    render() {
        const {
            navigation
        } = this.props;
        const itemID = navigation.getParam('itemid', "No-id");
        const otherParam = navigation.getParam('otherParam', "No-otherParam");
        return (
            <View style={styles.container}>
                <Text style={styles.biggerfont}>"Details Screen"</Text>
                <Text style={styles.biggerfont}>{JSON.stringify(itemID)}</Text>
                <Text style={styles.biggerfont}>{JSON.stringify(otherParam)}</Text>
                <View style={styles.buttonContainer}>
                    <Button
                        title="Go back to home"
                        onPress={() => this.props.navigation.navigate('Home')}
                    />
                </View>
                <View style={styles.buttonContainer}>
                    <Button
                        title="Go back"
                        onPress={() => this.props.navigation.goBack()}
                    />
                </View>
            </View>
        );
    }
}

class BLEModule extends React.Component {
    constructor(props){
        super(props)
        this.props.navigationOptions={
            header:10,

        }
    }

    render() {
        return (
            <View style={styles.container}>
                <BluetoothScreen/>
            </View>
        );
    }

}

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state={
        }

    }

    render() {
        return (
            <View style={styles.container}>
                <StatusBar translucent={false} backgroundColor='#DA70D6' barStyle="dark-content" />
                <LoginScreen
                    pre='111'
                    onPress={() => this.props.navigation.navigate('Home',
                    {
                        itemid:100,//页面之间传递的参数
                        text:this.state.Text,
                        otherParam:'this is other param',
                    })}
                />
            </View>
        );
    }

    onPless() {

        this.props.navigation.navigate('Details');
        console.log('collect!');
    }


}

const AppNavigator = createStackNavigator({
    Home: HomeScreen,
    Details: DetailsScreen,
    NetWorkTest: NetWorkTest,
    BLEModule: {
        screen:BLEModule,
        navigationOptions:{
            headerTitle:'BLE Module',
            headerStyle:{
                marginTop:35,
            }
        }
    },
    Login:{
        screen:Login,
        navigationOptions:{
            header:null,
        }
    },
}, {
    initialRouteName: 'Login',

    defaultNavigationOptions: {
        //header: null
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    ImageContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonContainer: {
        margin: 20,
    },
    alternativeLayoutButtonContainer: {
        margin: 20,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    biggerfont: {
        fontSize: 20,
        color: '#FF69B4',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: 20,
    },
    simpleImage: {
        flex: 1,
    },
    item: {
        flexDirection: 'column',
        borderColor: 'rgb(235,235,235)',
        borderStyle: 'solid',
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingLeft: 10,
        paddingVertical: 8,
    },
    buttonView: {
        height: 30,
        backgroundColor: 'rgb(33, 150, 243)',
        paddingHorizontal: 10,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: 'center',
        marginTop: 10
    },
    buttonText: {
        color: "white",
        fontSize: 12,
    },
    content: {
        marginTop: 5,
        marginBottom: 15,
    },
    textInput: {
        paddingLeft: 5,
        paddingRight: 5,
        backgroundColor: 'white',
        height: 50,
        fontSize: 16,
        flex: 1,
    },

})

AppRegistry.registerComponent('loginAnimation', () => loginAnimation);

export default createAppContainer(AppNavigator);
