import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Route, Redirect } from 'react-router-dom';

//here accept the component prop from App.js and anything else that is passed with it
const PrivateRoute = ({ component: Component, auth: { isAuthenticated, loading }, ...rest}) => (
    <Route 
        {...rest}
        render={props =>
            !isAuthenticated && !loading ? (
                //if not authenticated then redirect to login, else load the component
                <Redirect to='/login' />
            ) : (
                <Component {...props} />
            )
        } 
    />
);

PrivateRoute.propTypes = {
    auth: PropTypes.object.isRequired
};
  
const mapStateToProps = state => ({
    auth: state.auth
});

export default connect(mapStateToProps)(PrivateRoute)