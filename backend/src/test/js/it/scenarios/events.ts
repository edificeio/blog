import { describe } from "https://jslib.k6.io/k6chaijs/4.3.4.0/index.js";
import {
  authenticateWeb,
  createAndSetRole,
  linkRoleToUsers,
  activateUsers,
  createEmptyStructure,
  Structure,
  UserInfo,
  createUserAndGetData,
  getHeaders,
  getLastEventsOrFail,
  EventDTO
} from "../../node_modules/edifice-k6-commons/dist/index.js";
import {
  createBlog,
} from "../_utils.ts";
import http from "k6/http";
import { check } from "k6";
const maxDuration = __ENV.MAX_DURATION || "1m";
const gracefulStop = parseInt(__ENV.GRACEFUL_STOP || "2s");
const schoolName = __ENV.DATA_SCHOOL_NAME || "General - One user";
const rootUrl = __ENV.ROOT_URL;

export const options = {
  setupTimeout: "1h",
  thresholds: {
    checks: ["rate == 1.00"],
  },
  scenarios: {
    updateComment: {
      executor: "per-vu-iterations",
      vus: 1,
      maxDuration: maxDuration,
      gracefulStop,
    },
  },
};

type InitData = {
  head: Structure;
  users: UserInfo[];
}


export function setup() {
  let structure;
  let users: UserInfo[] = [];
  describe("[Blog-Init] Initialize data", () => {
    authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD);
    structure = createEmptyStructure(`${schoolName}`, true)
    users.push(createUserAndGetData({
      firstName: "Blogare " + Date.now(),
      lastName: "User",
      "type": "Teacher",
      structureId: structure.id,
      birthDate: "2020-01-01",
      positionIds: []
    }));
    users.push(createUserAndGetData({
      firstName: "Blogare " + Date.now(),
      lastName: "User",
      "type": "Teacher",
      structureId: structure.id,
      birthDate: "2020-01-01",
      positionIds: []
    }));
    activateUsers(structure);
    const roles = [
      createAndSetRole('Blog'),
    ];
    const groups = [
        `Teachers from group ${structure.name}.`,
    ]
    for (const role of roles) {
      linkRoleToUsers(structure, role, groups);
    }
  });
  return { head: structure, users };
}

export default (context: InitData) => {
  const { users } = context;
  const user = users[0];

  console.log("Authenticate teacher1 " + user.login);
  const session = authenticateWeb(user.login);

  const now = Date.now();
  describe("[Blog] Access event", () => {
    const blog = createBlog(`Blog of ${user.firstName} ${user.lastName}`, session);
    // Access blog page
    http.get(`${rootUrl}/blog`, { headers: getHeaders() });
    // Access the created blog page
    http.get(`${rootUrl}/blog/id/${blog.id}?state=PUBLISHED`, { headers: getHeaders() });
    
    authenticateWeb(__ENV.ADMC_LOGIN, __ENV.ADMC_PASSWORD);
    const events: EventDTO[] = getLastEventsOrFail(now, 'events').sort((a, b) => a.date - b.date);
    console.log(`Events since ${now} : ${JSON.stringify(events)}`);
    check(events, {
      "Should have 3 events (creation, deduplicated access and admc login)": (events) => events.length >= 3,
      "First event is for the creation of the blog": (events) => {
        const creationEvent = events[0];
        return !!creationEvent &&
               creationEvent['resource-type'] === "blog_private" &&
               creationEvent['event-type'] === "CREATE" &&
               creationEvent.module === "Blog" &&
               creationEvent.userId === user.id &&
               creationEvent.profil === 'Teacher';
      },
      "Second event is for blog page accesses (deduplicated)": (events) => {
        const accessEvent = events[1];
        return !!accessEvent &&
          accessEvent['event-type'] === "ACCESS" &&
          accessEvent.module === "Blog" &&
          accessEvent.userId === user.id &&
          accessEvent.profil === 'Teacher';
      },
      "Third event is for ADMC login": (events) => {
        const loginEvent = events[2];
        return !!loginEvent && loginEvent['event-type'] === "LOGIN" &&
               loginEvent.module === "Auth";
      },
    });

  });
}
