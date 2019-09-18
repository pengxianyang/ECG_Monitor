import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Logo from './Logo';
import Form from './Form';
import Wallpaper from './Wallpaper';
import ButtonSubmit from './ButtonSubmit';
import SignupSection from './SignupSection';

export default class LoginScreen extends Component {
    constructor(props){
        super(props)
        this.state={
            username:'',
            userpassword:'',
        }

        this._onChangeUserName.bind(this);
        this._onChangePassword.bind(this);
        this._uplodeUserInfromation.bind(this);
    }

    _onChangeUserName(username) {
        this.setState({username:username});
        console.log(this.state.username);
    }

    _onChangePassword(password) {
        this.setState({userpassword:password});
        console.log(this.state.userpassword);
    }

    _uplodeUserInfromation(username,userpassword){
        fetch('http://106.54.62.64:8080/login', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userName: this.state.username,
                password: this.state.userpassword,
                // userName: 'user',
                // password: 'password',
            }),
            timeout: 20*1000,

        }).then((response) => {
            if (response.ok) {
                return response.json();
            }
        }).then((responseJson) => {
                console.log("结果Code：" + responseJson.code);
                console.log("结果message：" + responseJson.message);
                console.log("请求的名字为：" + responseJson.data.nickName);

                return responseJson.code;
            })
            .catch((error) => {
                console.log("错误信息为：" + error);
            });
    }

  render() {
    return (
      <Wallpaper>
        <Logo />
        <Form
            onChangeUserName={(username)=>this._onChangeUserName(username)}
            onChangePassword={(password)=>this._onChangePassword(password)}
        />
        <SignupSection />
        <ButtonSubmit usr={this.state.username}
                      pwd={this.state.userpassword}
                      onPress={this.props.onPress}
                      onUplord={(usr,pwd)=>this._uplodeUserInfromation(usr,pwd)}
        />
      </Wallpaper>
    );
  }
}
