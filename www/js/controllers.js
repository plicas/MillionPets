angular.module('starter.controllers', [])
.controller('PetsCtrl', function($scope,$http, $ionicLoading) {

  $scope.keyword = "";
  $scope.next_page == null;

  console.log(window.navigator.language);
  /* init pets */
  $scope.initPets = function(){

    $scope.items = [];
    $http.get('http://staging.4paws.pt/api/v1/pets').success(function(response){
      var itemsRecebidos = response.pets.data;
      for (var i = 0; i < itemsRecebidos.length; i++) {
        $scope.items.push(itemsRecebidos[i]);
      };

      $scope.$broadcast('scroll.infiniteScrollComplete');
      $scope.next_page = response.pets.next_page_url;
      $ionicLoading.hide();
    })

  };

  /* load more */
  $scope.loadPets = function(keyword){
    if($scope.next_page){
      console.log($scope.next_page);
      $http.get($scope.next_page, {params: {keyword: keyword}}).success(function(response){
        var itemsRecebidos = response.pets.data;
        for (var i = 0; i < itemsRecebidos.length; i++) {
          $scope.items.push(itemsRecebidos[i]);
        };
        $scope.next_page = response.pets.next_page_url;
        $scope.$broadcast('scroll.infiniteScrollComplete');
        $ionicLoading.hide();
      })
    } else {
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $ionicLoading.hide();
    }

  };



  /* search pet */
  $scope.searchPet = function(keyword){

    $ionicLoading.show({
      content: 'Loading',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 200,
      showDelay: 0
    });

    // $scope.items = [];
    $http.get('http://staging.4paws.pt/api/v1/pets', {params: {keyword: keyword}}).success(function(response){
      $scope.items = [];
      var itemsRecebidos = response.pets.data;
      for (var i = 0; i < itemsRecebidos.length; i++) {
        $scope.items.push(itemsRecebidos[i]);
      };
      $scope.next_page = response.pets.next_page_url;
      $ionicLoading.hide();
    }).error(function(response){
      $scope.$broadcast('scroll.infiniteScrollComplete');
      $ionicLoading.hide();
    })
  }

  /* pull to refresh */
  $scope.doRefresh = function() {
    $http.get('http://staging.4paws.pt/api/v1/pets')
    .success(function(response) {
      $scope.items = [];
      var itemsRecebidos = response.pets.data;
      for (var i = 0; i < itemsRecebidos.length; i++) {
        $scope.items.push(itemsRecebidos[i]);
      };
      $scope.next_page = response.pets.next_page_url;
    })
    .finally(function() {
      // Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.infiniteScrollComplete');
    });
  };

})

.controller('PetDetailCtrl', function($scope,$http, $stateParams, $cordovaCamera, $cordovaFileTransfer,$state, $ionicLoading, $ionicPopup, $translate) {


  $http({
    url: 'http://staging.4paws.pt/api/v1/pet/'+$stateParams.petID,
    method: "GET"
  }).then(function successCallback(response) {
    $scope.pet = response.data.pet;
    console.log($scope.pet);
    $ionicLoading.hide();

  }, function errorCallback(response) {


  })

  /* save stuff */
  $scope.showImage = 0;
  $scope.images = [];

  /* get camera */
  $scope.getCamera = function(){
    var options = {
      quality: 70,
      destinationType: Camera.DestinationType.FILE_URI,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: true,
      encodingType: Camera.EncodingType.JPEG,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: false,
      correctOrientation:true
    };
    $cordovaCamera.getPicture(options).then(function(imageData) {
      $scope.showImage = 1;
      var image = document.getElementById('lostDogImage');
      image.src = imageData;
    }, function(err) {

    });
  }

  $scope.getGallery = function(){
    var options = {
      quality: 70,
      destinationType: Camera.DestinationType.FILE_URI,
      // sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
      allowEdit: true,
      encodingType: Camera.EncodingType.JPEG,
      popoverOptions: CameraPopoverOptions,
      mediaType: Camera.MediaType.PICTURE,
      saveToPhotoAlbum: false
    };


    /* GET GALLERY */
    $cordovaCamera.getPicture(options).then(function(imageData) {
      $scope.showImage = 1;
      // console.log("img URI= " + imageData);
      if (imageData.substring(0,21)=="content://com.android") {
        photo_split=imageData.split("%3A");
        imageURI="content://media/external/images/media/"+photo_split[1];

        // $scope.galeria = imageURI;
        var image = document.getElementById('lostDogImage');
        image.src = imageURI;

      } else {
        // $scope.galeria = imageData;
        // var image = document.getElementById('reconhecimentoImage');
        // image.src = "data:image/jpeg;base64," + imageData;
        // $scope.galeria = imageURI;
        var image = document.getElementById('lostDogImage');
        image.src = imageData;
      }

    }, function(err) {
      // alert("Erro: " + err);
    });
  }

  /* SUBMIT FORM */
  $scope.submit = function(pet) {
    $ionicLoading.show({
      content: 'Loading',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 200,
      showDelay: 0
    });
    var params = {};
    params.id = pet.id;
    params.name = pet.name;
    params.owner_name = pet.owner_name;
    params.description = pet.description;

    /* image */
    var server = 'http://staging.4paws.pt/api/v1/pets/save';
    var filePath = document.getElementById('lostDogImage').src;
    var extension = filePath.slice(Math.max(0, filePath.lastIndexOf(".")) || Infinity);

    var options = {};
    options.fileKey = "picture1";
    options.chunkedMode = false;
    if(extension == ".png"){
      options.fileName = "imagem.png";
      options.mimeType = "image/png";
    } else {
      options.fileName = "imagem.jpeg";
      options.mimeType = "image/jpeg";
    }
    options.params = params;
    if(filePath == ""){
      return $http({
        url: 'http://staging.4paws.pt/api/v1/pets/save',
        method: "POST",
        data: params
      }).then(function successCallback(response) {
        $ionicLoading.hide();
        var tl = new TimelineMax();
        tl.call(function() {
          tl.pause();
          $translate(['DONE_TEXT_TITLE', 'DONE_TEXT_DESCRIPTION']).then(function(translations) {
            $ionicPopup.alert({
              title: translations.DONE_TEXT_TITLE,
              template: translations.DONE_TEXT_DESCRIPTION
            }).then(function() {
              tl.resume();

            });
            $state.go('tab.pets');
          });
        });
      }, function errorCallback(response) {
        $ionicLoading.hide();
      });
    }else{


     $cordovaFileTransfer.upload(server, filePath, options).then(function successCallback(result) {
       $ionicLoading.hide();

       $location.path('/pets');
       // MOSTRA O ALERTA
     }, function errorCallback(err) {
       $ionicLoading.hide();
       // MOSTRA O ALERTA
       var tl = new TimelineMax();
       tl.call(function() {
         tl.pause();
         $translate(['ERROR_RECOGNITION_TITLE', 'ERROR_RECOGNITION_TEXT']).then(function(translations) {
           $ionicPopup.alert({
             title: translations.ERROR_RECOGNITION_TITLE,
             template: translations.ERROR_RECOGNITION_TEXT
           }).then(function() {
             tl.resume();
           });
         });
       });
     }, function (progress) {
       console.log(progress);
     });
  }

};

})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
