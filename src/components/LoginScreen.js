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
    }

    _onChangeUserName(username) {
        this.setState({username:username});
        console.log(this.state.username);
    }

    _onChangePassword(password) {
        this.setState({userpassword:password});
        console.log(this.state.userpassword);
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
        />
      </Wallpaper>
    );
  }
}
