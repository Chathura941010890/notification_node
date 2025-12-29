const axios = require("axios");
const { callEncrypt } = require("../utils/AESEncrypt");

let lastFetchedUsers = [];

const authBackendDedicatedCode = "INQUBE-AUTH-MODULE";

async function getUser(userId, parameter) {
  try {
    let cachedUser = lastFetchedUsers.find((user) => user.id === userId);

    if (cachedUser) {
      if (parameter === "All") {
        return cachedUser;
      } else {
        return cachedUser[parameter];
      }
    } else {
      const encrypted = await callEncrypt(authBackendDedicatedCode);

      const response = await axios.get(
        `${process.env.MS_AUTH_API}/users/${userId}`,
        {
          headers: {
            "x-api-key": JSON.stringify(encrypted),
          },
        }
      );
      const fetchedUser = response.data?.data;

      if (lastFetchedUsers.length >= 20) {
        lastFetchedUsers.shift();
      }
      lastFetchedUsers.push(fetchedUser);

      if (parameter === "All") {
        return fetchedUser;
      } else {
        return fetchedUser[parameter];
      }
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

async function getUsersFactoryByUserID(userId, parameter) {
  try {
    const encrypted = await callEncrypt(authBackendDedicatedCode);

    const response = await axios.get(
      `${process.env.MS_AUTH_API}/users/getUsersFactoryByUserID/${userId}`,
      {
        headers: {
          "x-api-key": JSON.stringify(encrypted),
        },
      }
    );

    if (parameter == "All") {
      return response.data?.data;
    } else {
      return response.data?.data[parameter];
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

async function getAllUsers(system) {
  try {
    const encrypted = await callEncrypt(authBackendDedicatedCode);

    const response = await axios.get(
      `${process.env.MS_AUTH_API}/users/getAllUsers`,
      {
        headers: {
          "x-api-key": JSON.stringify(encrypted),
        },
      }
    );
    const fetchedUsers = response.data?.data;

    const filteredData = fetchedUsers.filter((person) =>
      person.UserSystems.some((userSystem) => userSystem.System.name === system)
    );

    return filteredData;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

async function getUsersBySystemAndRole(system, role) {
  try {
    const encrypted = await callEncrypt(authBackendDedicatedCode);

    const response = await axios.get(
      `${process.env.MS_AUTH_API}/getUsersBySystemAndRole/${system}/${role}`,
      {
        headers: {
          "x-api-key": JSON.stringify(encrypted),
        },
      }
    );
    const fetchedUsers = response.data;

    return fetchedUsers;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

async function getAllUserDataByID(id) {
  try {
    const encrypted = await callEncrypt(authBackendDedicatedCode);

    const response = await axios.get(
      `${process.env.MS_AUTH_API}/getAllUserDataByID/${id}`,
      {
        headers: {
          "x-api-key": JSON.stringify(encrypted),
        },
      }
    );
    const fetchedUsers = response.data?.data;

    return fetchedUsers;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

module.exports = {
  getUser,
  getUsersFactoryByUserID,
  getAllUsers,
  getUsersBySystemAndRole,
  getAllUserDataByID,
};
