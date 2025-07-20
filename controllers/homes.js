const Home = require("../models/homedata");
const User = require("../models/user");
const fs = require("fs");

exports.geteditHome = async (req, res, next) => {
  const homeId = req.params.homeId;
  //  console.log(homeId);
  try {
    const home = await Home.findById(homeId);
    if (!home) {
      return res.status(404).json({ success: false, message: "Home not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Home fetched successfully",
      editing: true,
      homeId,
      home,
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Error in geteditHome:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.posteditHome = async (req, res, next) => {
  // Only allow host to edit their own home
  const hostId = req.session.user._id;
  const { _id, houseName, price, location, rating, description } = req.body;
  try {
    //find the home from hoem id and humne har home detail me uske owner ki id set kr rkhi h so match that id with req.session.user._id and if match h to edit kr dege
    const home = await Home.findOne({ _id, host: hostId });
    if (!home) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this home" });
    }
    home.houseName = houseName;
    home.price = price;
    home.location = location;
    home.rating = rating;
    home.description = description;
    if (req.file) {
      fs.unlink(home.photo, (err) => {
        if (err) {
          console.log("err while deleting photo ", err);
        }
      });
      home.photo = req.file.path;
    }
    await home.save();
    return res.status(200).json({
      success: true,
      message: "Home updated successfully",
      home,
    });
  } catch (err) {
    console.error("Error updating home:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.gethome = async (req, res, next) => {
  const homePage = await Home.find();
  res
    .status(200)
    .json({
      homePage,
      pageTitle: "airbnb Home",
      currentPage: "Home",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
};

// home listpage
exports.gethomelist = async (req, res, next) => {
  const homelist = await Home.find();
  res
    .status(200)
    .json({
      homelist,
      pageTitle: "Home-List",
      currentPage: "Home-List",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
};

exports.getfavouritelist = async (req, res, next) => {
  const userId = req.session.user._id; // extract userId from session
  const user = await User.findById(userId).populate("favourites"); // now userId se User model me find krk vo user nikala and uski fav list ko populate kr diya
  res
    .status(200)
    .json({
      favourites: user.favourites,
      pageTitle: "Favourite Home List",
      currentPage: "FavouriteList",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
};


exports.getbooking = async (req, res, next) => {
  //by default .render view me check krta h
  res.status(200).json({
    pageTitle: "Bookings",
    currentPage: "Booking",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};


exports.gethomedetails=async (req, res, next) => {
  const homeId = req.params.homeId;
  // console.log(homeId);
  const home = await Home.findById(homeId);
  // console.log(home);
  res.status(200).json({
    home: home,
    pageTitle: "Home Deatils",
    currentPage: "Home-List",
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
}; 


exports.postaddtofav=async(req, res, next) => {
  const homeId = req.body.id; 
  console.log("Adding to favourites for home ID:", req.body);
  const userId = req.session.user._id; 
  const user = await User.findById(userId);
  if (!user.favourites.includes(homeId)) {
    user.favourites.push(homeId);
    await user.save();
  }
  res
    .status(200)
    .json({
      favourites: user.favourites,
      pageTitle: "Favourite Home List",
      currentPage: "FavouriteList",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
};

exports.postremovefromfav = async (req, res, next) => {
  try {
    const homeId = req.body.id;
    const userId = req.session.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    user.favourites = user.favourites.filter(
      (favId) => favId.toString() !== homeId
    );

    await user.save();

    console.log("Updated favourites:", user.favourites);

    return res.status(200).json({
      success: true,
      message: "Home removed from favourites successfully",
      updatedFavourites: user.favourites,
    });
  } catch (error) {
    console.error("Error removing from favourites:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};




exports.getaddHome=(req,res,next)=> {
  res.status(200).json({
    pageTitle: "Add Home to airbnb",
    currentPage: "addHome",
    editing: false,
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
  });
};  


exports.postaddHome = async (req, res, next) => {
  // Get the current user's ID from the session
  const hostId = req.session.user._id;
  // console.log("Host ID:", hostId);
  // console.log("FILE:", req.file);
  try {
    const { houseName, price, location, rating, description } = req.body;
    const photo = req.file.path;
    // Create new home with host field
    const home = new Home({
      houseName,
      price,
      location,
      rating,
      photo,
      description,
      host: hostId, // Associate home with host
    });
    const savedHome = await home.save();
    // Add this new home id to user hostHomesList array 
    await User.findByIdAndUpdate(hostId, { $push: { hostHomesList: savedHome._id } });
    console.log("home saved and added to hostHomesList");
    res.status(201).json({
      message: "Home added successfully",
      home: savedHome,
    });
  } catch (error) {
    console.error("Error in postaddHome:", error);
    res.status(500).json({ message: "Failed to add home", error });
  }
};



exports.gethosthomelist = async (req, res, next) => {
  try {
    const hostId = req.session.user._id;

    // we can use populate method also like
    // const host = await User.findById(hostId).populate("hostHomesList");
    // const registeredHomes = host.hostHomesList;

    const registeredHomes = await Home.find({ host: hostId });
    // isse hum home ke andar jo host id store kr rkhi h use match kr rhe h  req.session.user._id isse taki jisne log in kr rkha h usi ke homes dikhe 
    res.status(200).json({
      registeredHomes,
      pageTitle: "Host Home List",
      currentPage: "Host-Home-List",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error fetching host home list:", error);
    res.status(500).json({ message: "Failed to fetch host home list." });
  }
};

exports.postremovefromhost = async (req, res, next) => {
  const homeId = req.body.id;
  const hostId = req.session.user._id;
  try {
    // Only allow host to delete their own home
    const home = await Home.findOne({ _id: homeId, host: hostId });
    if (!home) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this home" });
    }
    await Home.findByIdAndDelete(homeId);
    // Remove home ID from host's hostHomesList
    await User.findByIdAndUpdate(hostId, { $pull: { hostHomesList: homeId } });
    res.status(200).json({
      success: true,
      message: "Home deleted successfully",
      deletedId: homeId,
    });
  } catch (error) {
    console.error("Error while deleting:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete home",
      error: error.message,
    });
  }
};

