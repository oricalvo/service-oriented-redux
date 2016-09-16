var myApp = angular.module("myApp", []);

var $parse;

myApp.run(function(_$parse_) {
    $parse = _$parse_;
});

myApp.controller("HomeCtrl", function ($scope, contactService) {

    $scope.filter = "";

    store.subscribe(function () {
        $scope.contacts = store.getState().contacts;
    });

    contactService.loadAll();

    $scope.remove = function (contact) {
        contactService.deleteById(contact.id);
    }

    // $scope.filter = function() {
    //     contactService.loadContacts();
    // }
});

function ContactService($q) {
}

ContactService.prototype.loadAll =  function () {
    if(this.state) {
        return this.state;
    }

    return [
        {id: 1, name: "Ori"},
        {id: 2, name: "Roni"},
    ];
}

ContactService.prototype.deleteById = function (contactId) {
    var index = this.state.findIndex(c => c.id == contactId);
    if (index == -1) {
        return this.contacts;
    }

    var newContacts = this.state.concat([]);
    newContacts.splice(index, 1);

    return newContacts;
}

ContactService.name = "contacts";
ContactService.statePath = ["contacts"];

myApp.service("contactService", ContactService);

myApp.decorator("contactService", function ($delegate) {
    return generateReduxProxy($delegate);
});

function generateReduxProxy(service) {
    var proxy = {};

    for (var methodName in service) {
        proxy[methodName] = createReduxMethodProxy(service, methodName);
    }

    return proxy;
}

function createReduxMethodProxy(service, methodName) {
    return function () {

        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        store.dispatch({
            type: "SERVICE_" + service.name + "_" + methodName,
            service: service,
            method: service[methodName],
            args: args,
        })
    }
}

function contactReducer(state, action) {
    if (action.type == "LOAD_CONTACTS") {
    }
}

function rootReducer(state, action) {
    if (action.type.startsWith("SERVICE")) {
        var args = action.args.concat([]);

        var childState = state;
        var statePath = action.service.constructor.statePath;
        for(var i=0; i<statePath.length; i++) {
            childState = childState[statePath[i]];
        }

        //args.unshift(childState);
        action.service.state = childState;
        var childNewState = action.method.apply(action.service, args);
        if(childNewState == childState) {
            return state;
        }
        action.service.state = null;

        var newState = createNewState(state, statePath, 0, childNewState);
        return newState;
    }

    return state;
}

function createNewState(state, path, index, childNewState) {
    var newState = Object.assign({}, state);

    if(index+1 == path.length) {
        newState[path[index]] = childNewState;
    }
    else {
        newState[path[index]] = createNewState(state[path[index]], path, index + 1, childNewState);
    }

    return newState;
}

var store = Redux.createStore(rootReducer, {
    contacts: null,
});

