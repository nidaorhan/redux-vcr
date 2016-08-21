import { actionTypes, actionCreators } from 'redux-vcr.shared';
// import { actionTypes, actionCreators } from '../../shared/src';

const {
  SIGN_IN_REQUEST,
  CASSETTES_LIST_REQUEST,
  SELECT_CASSETTE,
} = actionTypes;
const {
  cassetteActionsReceive,
  cassettesListReceive,
  cassettesListFailure,
  signInReceive,
  signInFailure,
} = actionCreators;

const createRetrieveMiddleware = ({ dataHandler }) => store => next => action => {
  switch (action.type) {
    case SIGN_IN_REQUEST: {
      return dataHandler
        .signIn(action.authMethod)
        .then(({ credential }) => {
          next(signInReceive({ user: credential }));
        })
        .catch(error => {
          console.error('Problem authenticating with Firebase:', error);
          next(signInFailure({ error }));
        });
    }

    case CASSETTES_LIST_REQUEST: {
      dataHandler
        .retrieveList()
        .then(snapshot => snapshot.val())
        .then(cassettes => next(cassettesListReceive({ cassettes })))
        .catch(error => next(cassettesListFailure({ error })));

      return next(action);
    }

    case SELECT_CASSETTE: {
      // If we already have the cassette's actions, no data-fetching is required.
      const storedActions = store.getState().reduxVCR.actions.byId;
      if (storedActions[action.id]) {
        return next(action);
      }

      dataHandler
        .retrieveActions({ id: action.id })
        .then(snapshot => snapshot.val())
        .then(cassetteActions => {
          next(cassetteActionsReceive({
            id: action.id,
            cassetteActions,
          }));

          // Also dispatch the original action;
          // We still need to select the cassette we just received actions for.
          next(action);
        });

      return null;
    }

    default: {
      return next(action);
    }
  }
};

export default createRetrieveMiddleware;
