(function () {
    'use strict';

    angular
        .module('mba-deadlines', ['ngResource', 'ui.router', 'ngSanitize', 'ngCookies', 'ngQuill'])
        .run(runBlock)
        .config(indexConfig);

    // Run Function
    runBlock.$inject = ['$rootScope', '$state', '$cookies'];

    function runBlock($rootScope, $state, $cookies) {
        $rootScope.authorized = false;
        $rootScope.admin = false;
        $rootScope.hideNavbar = false;

        $rootScope.$on('$stateChangeStart', function (event, toState, toStateParams) {
            if (toState.redirectTo) {
                event.preventDefault();
                $state.go(toState.redirectTo);
            }

            // get user login
            if (!$cookies.get('auth')) {
                $rootScope.authorized = false;
            } else {
                $rootScope.authorized = true;
            }

            // get admin login
            if (!$cookies.get('admin')) {
                $rootScope.admin = false;
            } else {
                $rootScope.admin = true;
            }
        });

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toStateParams) {
            if (toState.data) {

                // hide nav bar from admin login
                if (toState.data.noNavbar) {
                    $rootScope.hideNavbar = true;
                } else {
                    $rootScope.hideNavbar = false;
                }

                // Check for user login
                if (toState.data.requireAuth) {
                    if (!$rootScope.authorized) {
                        console.log('not auth');
                        $state.go('login');
                    }
                }
                // check for admin login
                if (toState.data.requireAdminAuth) {
                    if (!$rootScope.admin) {
                        $state.go('landing-page');
                    }
                }
            }
        });
    }

    // Index State (route)
    indexConfig.$inject = ['$stateProvider', '$urlRouterProvider', '$httpProvider'];

    function indexConfig($stateProvider, $urlRouterProvider, $httpProvider) {
        $urlRouterProvider.otherwise('/home');

        $stateProvider.state('index', {
            abstract: true,
            views: {
                'navigation': {
                    templateUrl: 'shared/navigation/navigation.tpl.html',
                    controller: 'Navigation',
                    controllerAs: 'nav'
                }
            }
        });

        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
}());

(function () {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Navigation', NavigationController);

    NavigationController.$inject = ['$state', '$cookies', '$rootScope'];
    function NavigationController($state, $cookies, $rootScope) {

        // Local Variables
        var vm = this;

        // Exposed Variables
        vm.state = $state;

        // Exposed Functions
        vm.isLandingPage = isLandingPage;
        vm.isLoginPage = isLoginPage;
        vm.isSignupPage = isSignupPage;
        vm.signout = signout;

        // Implementations
        function isLandingPage() {
            return vm.state.is('landing-page');
        }

        function isLoginPage() {
            return vm.state.is('login');
        }

        function isSignupPage() {
            return vm.state.is('signup');
        }

        function signout() {
            $cookies.remove('auth');
            $rootScope.authorized = false;
            $rootScope.portalUser = {};
            $state.go('landing-page');
        }
    }
}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .filter('schoolSearchFilter', schoolSearchFilter);

    schoolSearchFilter.$inject = ['$filter'];

    function schoolSearchFilter($filter) {
        return function(input, query) {
            var universityList = [];
            for (var i = 0; i < input.length; i++ ) {
                if ( input[i].school.toLowerCase().indexOf(query.toLowerCase()) !== -1 || input[i].address.toLowerCase().indexOf(query.toLowerCase()) !== -1 ) {
                    universityList.push(input[i]);
                }
            }
            return universityList;
        }
    }
}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('adminService', adminService);

    adminService.$inject = ['BASE_URL', '$resource', '$cookies', '$state', '$rootScope'];
    function adminService (BASE_URL, $resource, $cookies, $state, $rootScope) {

        var adminResource = $resource(BASE_URL + '/admin');

        function adminLogout () {
            $cookies.remove('admin');
            $rootScope.admin = false;
            $state.go('landing-page');
        }

        return {
            rest: adminResource,
            logout: adminLogout
        };
    }

}());

(function () {
    angular
        .module('mba-deadlines')
       //.value('BASE_URL', 'http://localhost:3000');
         .value('BASE_URL', 'http://mbadeadlines.herokuapp.com');
}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('essayService', essayService);

    essayService.$inject = ['BASE_URL', '$resource'];
    function essayService (BASE_URL, $resource) {

        var schoolResource = $resource(BASE_URL + '/essays/:user_id/:school_id/:essay_id', {}, {
            update: {
                method: 'PUT'
            }
        });

        return {
            rest: schoolResource
        };
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('schoolsService', schoolsService);

    schoolsService.$inject = ['BASE_URL', '$resource'];
    function schoolsService (BASE_URL, $resource) {

        var schoolResource = $resource(BASE_URL + '/schools/:school_id');
        var bookmarkedResource = $resource(BASE_URL + '/bookmarks/:user_id', {}, {
            get: {
                method: 'GET',
                isArray: true
            },
            delete: {
                method: 'POST'
            }
        });


        return {
            rest: schoolResource,
            bookmarks: bookmarkedResource
        };
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('userService', userService);

    userService.$inject = ['BASE_URL', '$resource'];
    function userService (BASE_URL, $resource) {
        var userResource = $resource(BASE_URL + '/auth', {}, {
            post: {
                'method': 'POST'
            }
        });
        var userData = $resource(BASE_URL + '/users/:id', {}, {
            update: {
                method: 'PUT'
            }
        });

        return {
            rest: userResource,
            data: userData
        }
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('AdminDeadlines', AdminDeadlines);
    AdminDeadlines.$inject = ['schoolsService', '$rootScope'];
    function AdminDeadlines (schoolsService, $rootScope) {

        // Local Variables
        var vm = this;

        // Exposed Variables
        vm.searchQuery = '';
        vm.data = [];
        vm.selectedSchool = {};
        vm.selectedRoud = '';

        // Exposed Functions
        vm.addSchool = addSchool;
        vm.selectRound = selectRound;
        vm.isSelected = isSelected;

        init();

        function addSchool (school) {
            vm.selectedSchool = school;
            $('.uni-details-modal.ui.modal')
                .modal({
                    onHide: function () {
                        vm.selectedRoud = '';
                    }
                })
                .modal('show');
        }

        function selectRound ( round ) {
            vm.selectedRoud = round;
        }

        function isSelected ( round ) {
            return vm.selectedRoud === round;
        }

        function init() {
            $rootScope.isLoading = true;
            schoolsService.rest.query(function(schools) {
                processDates(schools);
                vm.data = schools;
                $rootScope.isLoading = false;
            });
        }

        function processDates(schools) {
            for (var i = 0; i < schools.length; i++) {
                schools[i].roundOne = new Date(schools[i].roundOne);
                schools[i].roundTwo = new Date(schools[i].roundTwo);
                schools[i].roundThree = new Date(schools[i].roundThree);
                schools[i].roundFour = new Date(schools[i].roundFour);
            }
        }

    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(AdminDeadlinesRouter);

    AdminDeadlinesRouter.$inject = ['$stateProvider'];
    function AdminDeadlinesRouter($stateProvider) {
        $stateProvider.state('adminDeadlines', {
            parent: 'admindashboard',
            url: '/deadlines',
            views: {
                'adminContent': {
                    templateUrl: 'components/admin-dashboard/admin-deadlines/admin-deadlines.tpl.html',
                    controller: 'AdminDeadlines',
                    controllerAs: 'aDeadlines'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('adminDeadlinesSvc', adminDeadlinesService);

    adminDeadlinesService.$inject = ['BASE_URL', '$resource'];

    function adminDeadlinesService (BASE_URL, $resource) {
    	var deadlinesResource = $resource(BASE_URL + '');

    	return {
    		rest: deadlinesResource
    	}
    }

}());
(function () {
    "use strict";

    angular
        .module('mba-deadlines')
        .controller('AdminLogin', AdminLogin);

    AdminLogin.$inject = ['adminService', '$cookies', '$state'];
    function AdminLogin(adminService, $cookies, $state) {
        var vm = this;

        vm.email = '';
        vm.password = '';

        vm.authenticate = function () {
            adminService.rest.save({email: vm.email, password: vm.password}, function (admin) {
                if (admin) {
                    $cookies.put('admin', admin._id);
                    $state.go('admindashboard');
                } else {
                    ohSnap('Email/Password not valid', 'red');
                }
            });
        };
    }
}());

(function () {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(dashboardRouter);

    dashboardRouter.$inject = ['$stateProvider'];
    function dashboardRouter($stateProvider) {
        $stateProvider.state('admin-login', {
            parent: 'index',
            url: '/admin-login',
            data: {noNavbar: true},
            views: {
                'content@': {
                    templateUrl: 'components/admin-dashboard/admin-login/admin-login.tpl.html',
                    controller: 'AdminLogin',
                    controllerAs: 'adminLogin'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('AdminRankings', AdminRankings);
    // AdminRankings.$inject = ['$scope'];
    function AdminRankings() {

        var vm = this;

        vm.searchQuery = '';

        vm.data = [{
            "id": 1,
            "icon": "images/uni-badges/cambridge.png",
            "school": "Cambridge",
            "address": "Cambridge, England, United Kingdom",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["2", "down"],
            "usNews": ["2", "down"]
        }, {
            "id": 2,
            "icon": "images/uni-badges/stanford.png",
            "school": "Stanford University",
            "address": "450 Serra Mall, Stanford, CA 94305, United States",
            "financial": ["4", "down"],
            "businessWeek": ["3", "down"],
            "economist": ["4", "down"],
            "usNews":["3", "minus"]
        }, {
            "id": 3,
            "icon": "images/uni-badges/harvard.png",
            "school": "Harvard University",
            "address": "Cambridge, MA 02138, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "up"],
            "economist": ["2", "down"],
            "usNews": ["3", "minus"]
        }, {
            "id": 4,
            "icon": "images/uni-badges/mit.png",
            "school": "MIT",
            "address": "77 Massachusetts Ave, Cambridge, MA 02139, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["1", "up"],
            "usNews": ["4", "down"]
            }, {
            "id": 5,
            "icon": "images/uni-badges/yale.png",
            "school": "Yale University",
            "address": "New Haven, CT 06520, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "up"],
            "economist": ["3", "down"],
            "usNews": ["3", "minus"]
            }, {
            "id": 6,
            "icon": "images/uni-badges/oxford.png",
            "school": "University of Oxford",
            "address": "Oxford, England, United Kingdom",
            "financial": ["3", "minus"],
            "businessWeek": ["2", "up"],
            "economist": ["2", "down"],
            "usNews": ["3", "minus"]
            }, {
            "id": 7,
            "icon": "images/uni-badges/columbia.png",
            "school": "Columbia University",
            "address": "116th St & Broadway, New York, NY 10027, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["1", "up"],
            "usNews": ["1", "up"]
            }, {
            "id": 8,
            "icon": "images/uni-badges/nyu.png",
            "school": "New York University",
            "address": "New York, NY, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["2", "down"],
            "usNews": ["5", "down"]
            }
        ];

        vm.getRankStatus = getRankStatus;

        function getRankStatus (status) {
            var ret = '';
            if (status === 'up') {
                ret = 'up green';
            } else if (status === 'down') {
                ret = 'down red';
            } else {
                ret = 'minus yellow';
            }
            return ret;
        }
    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(AdminRankingsRouter);

    AdminRankingsRouter.$inject = ['$stateProvider'];
    function AdminRankingsRouter($stateProvider) {
        $stateProvider.state('adminRankings', {
            parent: 'admindashboard',
            url: '/rankings',
            views: {
                'adminContent': {
                    templateUrl: 'components/admin-dashboard/admin-rankings/admin-rankings.tpl.html',
                    controller: 'AdminRankings',
                    controllerAs: 'adminRankings'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('adminRankingsSvc', adminRankingsSvc);

    adminRankingsSvc.$inject = ['BASE_URL', '$resource'];

    function adminRankingsSvc (BASE_URL, $resource) {
    	var rankingsResource = $resource(BASE_URL + '');

    	return {
    		rest: rankingsResource
    	}
    }

}());
(function () {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('AdminSchools', AdminSchoolsController);
    AdminSchoolsController.$inject = ['schoolsService', '$http', 'BASE_URL', '$rootScope', '$scope', 'adminSchoolsSvc'];

    function AdminSchoolsController(schoolsService, $http, BASE_URL, $rootScope, $scope, adminSchoolsSvc) {

        // Local Variables
        var vm = this;

        // Exposed Variables
        vm.searchQuery = '';
        vm.allSchools = [];
        vm.isUS = false;

        vm.tempEssayFlag = false;
        vm.tempEssay = {};

        vm.selectedSchool = {};
        vm.mode = '';

        // Exposed Functions
        vm.delete = deleteSchool;
        vm.showSchool = showSchool;
        vm.addSchool = addSchool;
        vm.updateSchool = updateSchool;

        vm.addEssay = addTempEssay;
        vm.acceptEssay = pushTempEssay;
        vm.discardEssay = discardTempEssay;

        function initController () {
            $rootScope.isLoading = true;
            schoolsService.rest.query(function (schools) {
                vm.allSchools = schools;
                $rootScope.isLoading = false;
            });
        }

        function discardTempEssay () {
            vm.tempEssay = {};
            vm.tempEssayFlag = false;
        }
        function pushTempEssay () {
            if (!vm.selectedSchool.essays) {
                vm.selectedSchool.essays = [];
            }
            vm.selectedSchool.essays.push(vm.tempEssay);
            vm.tempEssayFlag = false;
        }
        function addTempEssay () {
            vm.tempEssayFlag = true;
        }

        function updateState(code, state) {
            vm.selectedSchool.state = code;
        }

        function updateCountry(code, country) {
            if (country) {
                var cont = country;
                vm.isUS = code === 'us';

                var ci = cont.indexOf('i>');
                cont = cont.slice(ci + 2);

                vm.selectedSchool.country = {
                    code: code,
                    name: cont
                };
            }
        }

        function showSchool (mode, school) {

            $('.label-help').popup({
                title: 'Rank Status',
                content: 'Comparison about rank going up, down or is constant as last years ratting.'
            });

            $('.add-essay').popup({
                title: 'Add Essay',
                content: 'Add new Essay topic?'
            });


            if (mode === 'edit') {
                vm.selectedSchool = school;
                vm.mode = 'Edit';

                $('.country.ui.dropdown').dropdown({
                    onChange: function (code, country) {
                        updateCountry(code, country);
                    }
                }).dropdown('set selected', vm.selectedSchool.country.code);

                $('.state.ui.dropdown').dropdown({
                    onChange: function (code, state) {
                        updateState(code, state);
                    }
                }).dropdown('set selected', vm.selectedSchool.state);


            } else if (mode === 'add') {
                vm.selectedSchool = {};
                vm.mode = 'Add';
                $('.country.ui.dropdown').dropdown({
                    onChange: function (code, country) {
                        updateCountry(code, country);
                    }
                });

                $('.state.ui.dropdown').dropdown({
                    onChange: function (code, state) {
                        updateState(code, state);
                    }
                });
            }

            $('.add-modal.ui.modal').modal({
                closable: false,
                onShow: function () {
                    convertAllDates(vm.selectedSchool, false);
                },

                onHide: function () {
                    clearAll();
                },
                onDeny: function () {
                    return true;
                },
                onApprove: function () {
                    if (vm.mode === 'Edit') {
                        updateSchool();
                    }
                    if (vm.mode === "Add") {
                        addSchool();
                    }
                    return true;
                }
            }).modal('show');
        }

        $scope.$watch('vm.selectedSchool.roundOne', function () {});

        // POST Request for adding new school
        function addSchool() {
            adminSchoolsSvc.rest.save(vm.selectedSchool, function () {
                refreshPage();
                ohSnap('Record Added', 'Green');
            });
        }

        // PUT Requiest for updating already existed school
        function updateSchool() {
            adminSchoolsSvc.rest.update({'school_id': vm.selectedSchool._id},vm.selectedSchool, function (obj) {
                refreshPage();
                ohSnap(obj.Success, 'Green');
            });
        }

        /**
         * Function called when ever any bookmark deleted
         * @param  {int} bokmark_id
         */
        function deleteSchool(id) {
            $('.delete-modal.modal').modal({
                onApprove: function () {
                    $http.delete(BASE_URL + '/schools/' + id, {}).success(function (data, status) {
                        // vm.bookmarkedSchools = vm.bookmarkedSchools.filter(function(el) {
                        //     return el._id !== id
                        // })
                        refreshPage();
                        ohSnap('Record Removed', 'green');
                        console.log(data, status);
                    }).error(function (error, status) {
                        ohSnap('Error Code: ' + status, 'red');
                    });

                }
            }).modal('show');
        }

        /**
         * Convert BSON ISO Date to UTC String
         * @param date BSON ISO
         * @param isDate is it a date or string. if date, convert to string, else convert to UTC
         * if false, it will return date, if true, it will return string
         * @returns {Date} UTC
         */
        function convertDate (date, isDate) {
            if (!isDate) {
                return new Date(date);
            }
            return date.toString();
        }

        function convertAllDates(selectedSchool, isDate) {
            // Round One
            if (selectedSchool.roundOne) {
                selectedSchool.roundOne = convertDate(selectedSchool.roundOne, isDate);
            }

            // Round Two
            if (selectedSchool.roundTwo) {
                selectedSchool.roundTwo = convertDate(selectedSchool.roundTwo, isDate);
            }

            // Round Three
            if (selectedSchool.roundThree) {
                selectedSchool.roundThree = convertDate(selectedSchool.roundThree, isDate);
            }

            // Round Four
            if (selectedSchool.roundFour) {
                selectedSchool.roundFour = convertDate(selectedSchool.roundFour, isDate);
            }
        }

        function clearAll() {
            console.log('hidden');
            vm.selectedSchool = {};
            vm.mode = '';
            vm.tempEssayFlag = false;
            vm.tempEssay = {};
            $('.ui.dropdown').dropdown('clear');
            $('.country.ui.dropdown').dropdown('clear');
            $('.state.ui.dropdown').dropdown('clear');
        }

        function refreshPage () {
            initController();
        }

        initController();


    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(AdminSchoolsRouter);

    AdminSchoolsRouter.$inject = ['$stateProvider'];
    function AdminSchoolsRouter($stateProvider) {
        $stateProvider.state('adminSchools', {
            parent: 'admindashboard',
            url: '/schools',
            views: {
                'adminContent': {
                    templateUrl: 'components/admin-dashboard/admin-schools/admin-schools.tpl.html',
                    controller: 'AdminSchools',
                    controllerAs: 'adminSchools'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('adminSchoolsSvc', adminSchoolsSvc);

    adminSchoolsSvc.$inject = ['BASE_URL', '$resource'];

    function adminSchoolsSvc (BASE_URL, $resource) {
        var rankingsResource = $resource(BASE_URL + '/schools/:school_id', {}, {
            update: {method: 'PUT'}
        });

        return {
            rest: rankingsResource
        }
    }

}());
(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('AdminStats', AdminStatsController);
    //AdminStatsController.$inject = ['$scope'];
    function AdminStatsController() {

        // Local Variables
        var vm = this;

        vm.searchQuery = '';
        vm.topSchools = [{
            "id": 1,
            "icon": "images/uni-badges/harvard.png",
            "school": "Harvard University",
            "address": "Cambridge, MA 02138, United States",
            "applications":2390
        }, {
                "id": 2,
                "icon": "images/uni-badges/cambridge.png",
                "school": "Cambridge",
                "address": "Cambridge, England, United Kingdom",
                "applications":1130
            }, {
                "id": 3,
                "icon": "images/uni-badges/stanford.png",
                "school": "Stanford University",
                "address": "450 Serra Mall, Stanford, CA 94305, United States",
                "applications":890
            },
            {
                "id": 4,
                "icon": "images/uni-badges/mit.png",
                "school": "MIT",
                "address": "77 Massachusetts Ave, Cambridge, MA 02139, United States",
                "applications":560
            },
            {
                "id": 5,
                "icon": "images/uni-badges/yale.png",
                "school": "Yale University",
                "address": "New Haven, CT 06520, Andorra",
                "applications":400
            }
        ];


    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(adminStatsRouter);

    adminStatsRouter.$inject = ['$stateProvider'];
    function adminStatsRouter($stateProvider) {
        $stateProvider.state('adminStats', {
            parent: 'admindashboard',
            url: '/stats',
            views: {
                'adminContent': {
                    templateUrl: 'components/admin-dashboard/admin-stats/admin-stats.tpl.html',
                    controller: 'AdminStats',
                    controllerAs: 'adminStats'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('adminStatsSvc', adminStatsSvc);

    adminStatsSvc.$inject = ['BASE_URL', '$resource'];

    function adminStatsSvc (BASE_URL, $resource) {
    	var rankingsResource = $resource(BASE_URL + '');

    	return {
    		rest: rankingsResource
    	}
    }

}());
(function () {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('SUEducation', EducationController);

    EducationController.$inject = ['$state', '$rootScope', '$cookies', '$scope', 'userService'];
    function EducationController($state, $rootScope, $cookies, $scope, userService) {
        $rootScope.isLoading = false;
        var vm = this;

        vm.education = {};

        vm.isValid = false;
        vm.addEducation = addEducation;
        vm.actionHandler = actionHandler;

        $scope.$on('$viewContentLoaded', function(){
            init();
        });

        function actionHandler (mode) {
            if (mode === 'back') {
                addEducation('ug-work-experience');
            } else {
                addEducation('dashboard');
            }
        }

        function addEducation(state) {
            $rootScope.isLoading = true;
            if (!vm.education.totalCgpa && !vm.education.obtCgpa && !vm.education.major && !vm.year) {
                vm.isValid = false;
                $rootScope.isLoading = false;
            } else if (vm.education.totalCgpa || vm.education.obtCgpa || vm.education.major || vm.year) {
                vm.isValid = true;
                $rootScope.isLoading = false;
            }

            if (vm.isValid) {
                userService.data.update({'id': $cookies.get('auth')}, {"education": vm.education}, function (argument) {
                    ohSnap(argument.Success, 'Green');
                    debugger;
                    $rootScope.isLoading = false;
                    $state.go(state);
                })
            } else {
                ohSnap('Data Missing', 'Red');
            }
        }

        function init () {
            debugger;
            $('.ug-major.dropdown').dropdown({
                onChange: function (val) {
                    vm.education.major = val;
                }
            });
        }
    }
}());
(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(signupStepOneRouter);

    signupStepOneRouter.$inject = ['$stateProvider'];
    function signupStepOneRouter($stateProvider) {
        $stateProvider.state('step1', {
            parent: 'signup',
            url: '/step1',
            views: {
                'signup-steps': {
                    templateUrl: 'components/signup/signup-steps/step1.tpl.html',
                    controller: 'Signup',
                    controllerAs: 'su'
                }
            }
        });
    }

}());


(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(signupStepTwoRouter);

    signupStepTwoRouter.$inject = ['$stateProvider'];
    function signupStepTwoRouter($stateProvider) {
        // States for step2
        $stateProvider.state('step2', {
            parent: 'signup',
            url: '/step2',
            redirectTo: 'su-student-profile',
            views: {
                'signup-steps': {
                    templateUrl: 'components/signup/signup-steps/step2.tpl.html',
                    controller: 'Signup'
                }
            }
        });

        // States for inner steps in Step2 (User Details)
        $stateProvider.state('su-student-profile', {
            parent: 'step2',
            url: '/student-profile',
            views: {
                'signup-inner-steps': {
                    templateUrl: 'components/signup/signup-steps/student-profile.tpl.html',
                    controller: 'SUStudentProfile',
                    controllerAs: 'sp'
                }
            }
        }).state('su-work-experience', {
            parent: 'step2',
            url: '/work-experience',
            views: {
                'signup-inner-steps': {
                    templateUrl: 'components/signup/signup-steps/work-experience.tpl.html',
                    controller: 'SUWorkExperience',
                    controllerAs: 'we'
                }
            }
        }).state('su-education', {
            parent: 'step2',
            url: '/education',
            views: {
                'signup-inner-steps': {
                    templateUrl: 'components/signup/signup-steps/education.tpl.html',
                    controller: 'SUEducation',
                    controllerAs: 'edu'
                }
            }
        });
    }

}());


(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .controller('SUStudentProfile',studentProfileController);

    studentProfileController.$inject = ['$state', '$rootScope', '$cookies', 'userService'];

    function studentProfileController($state, $rootScope, $cookies, userService) {
        $rootScope.isLoading = false;
        var vm = this;

        vm.studentProfile = {};

        vm.isValid = false;
        vm.addStudentProfile = addStudentProfile;


        function addStudentProfile () {
            $rootScope.isLoading = true;
            if (!vm.studentProfile.gre && !vm.studentProfile.gat) {
                vm.isValid = false;
                $rootScope.isLoading = false;
            } else if (vm.studentProfile.gre || vm.studentProfile.gat) {
                vm.isValid = true;
                $rootScope.isLoading = false;
            }

            if (vm.isValid) {
                userService.data.update({'id': $cookies.get('auth')}, { "student_profile": vm.studentProfile}, function (argument) {
                    ohSnap(argument.Success, 'Green');
                    $rootScope.isLoading = false;
                    $state.go('su-work-experience');
                })
            } else {
                ohSnap('Data Missing', 'Red');
            }
        }
    }

}());


(function () {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('SUWorkExperience', WorkExperienceController);

    WorkExperienceController.$inject = ['$state', '$rootScope', '$cookies', '$scope', 'userService'];
    function WorkExperienceController($state, $rootScope, $cookies, $scope, userService) {
        $rootScope.isLoading = false;
        var vm = this;

        vm.workExperience = {};

        vm.isValid = false;
        vm.addWorkExperience = addWorkExperience;
        vm.actionHandler = actionHandler;

        $scope.$on('$viewContentLoaded', function(){
            init();
        });

        function actionHandler (mode) {
            if (mode === 'back') {
                addWorkExperience('su-student-profile');
            } else {
                addWorkExperience('su-education');
            }
        }

        function addWorkExperience(state) {
            $rootScope.isLoading = true;
            if (!vm.workExperience.duration && !vm.workExperience.pre_mba && !vm.workExperience.post_mba) {
                vm.isValid = false;
                $rootScope.isLoading = false;
            } else if (vm.workExperience.duration || vm.workExperience.pre_mba || vm.workExperience.post_mba) {
                vm.isValid = true;
                $rootScope.isLoading = false;
            }

            if (vm.isValid) {
                userService.data.update({'id': $cookies.get('auth')}, {"work_experience": vm.workExperience}, function (argument) {
                    ohSnap(argument.Success, 'Green');
                    debugger;
                    $rootScope.isLoading = false;
                    $state.go(state);
                })
            } else {
                ohSnap('Data Missing', 'Red');
            }
        }

        function init () {
            debugger;
            $('.pre.dropdown').dropdown({
                onChange: function (val) {
                    vm.workExperience.pre_mba = val;
                }
            });

            $('.post.dropdown').dropdown({
                onChange: function (val) {
                    vm.workExperience.post_mba = val;
                }
            });
        }
    }
}());
(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('AdminDashboard', AdminDashboardController);
    AdminDashboardController.$inject = ['adminService'];
    function AdminDashboardController(adminService) {
        this.adminLogout = function () {
            adminService.logout();
        }
    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(AdminDashboardRouter);

    AdminDashboardRouter.$inject = ['$stateProvider'];
    function AdminDashboardRouter($stateProvider) {
        $stateProvider.state('admindashboard', {
            parent: 'index',
            data: {requireAdminAuth: true, noNavbar: true},
            url: '/admin',
            redirectTo: 'adminStats',
            views: {
                'content@': {
                    templateUrl: 'components/admin-dashboard/admin-dashboard.tpl.html',
                    controller: 'AdminDashboard',
                    controllerAs: 'admindashboard'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('adminServices', adminServices);

    adminServices.$inject = ['BASE_URL','$resource', '$http'];

    function adminServices (BASE_URL, $resource, $http) {

    	var schoolResource = $resource(BASE_URL + '/schools', {});
    	var httpSVC = $http(BASE_URL + '/schools/:id', {});

    	return {
    		rest: schoolResource,
    		http: httpSVC
    	}
    }

}());
(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Dashboard', DashboardController);
    DashboardController.$inject = ['$scope', 'schoolsService', 'userService', '$cookies', '$http', 'BASE_URL'];

    function DashboardController($scope, schoolsService, userService, $cookies, $http, BASE_URL) {

        // Local Variables
        var vm = this;
        var addDropDown = '';

        // Exposed Variables
        /**
         * Array which stores only bookmarked school objects
         * @type {Array}
         */
        vm.bookmarkedSchools = [];
        /**
         * Array which holds all School Objects
         * @type {Array}
         */
        vm.allSchools = [];
        /**
         * Object which holds class profile for specific school. Its updated every time you ask for class profile
         * as it only stores content of single object
         * @type {Object}
         */
        vm.classProfile = {};
        /**
         * Object which holds only selected school content during bookmark process.
         * This object is reset to empty when modal is closed.
         * @type {Object}
         */
        vm.selectedSchool = {};
        /**
         * Stores selected round number during bookmark process
         * @type {string}
         */
        vm.selectedRound = '';

        // Exposed Functions
        vm.isSchoolListEmpty = isSchoolListEmpty;
        vm.addSchool = addSchool;
        vm.selectRound = selectRound;
        vm.isSelected = isSelected;
        vm.bookMarkRound = bookMarkRound;
        vm.isDropdownSelected = isDropdownSelected;
        vm.bookmarked = isBookmarked;
        vm.getClassProfile = getClassProfile;
        vm.deleteBookmark = removeBookmark;
        vm.edit = editHandler;
        vm.isLoading = false;

        initController();
        // Function Definitions
        // Helper Functions

        /**
         * When used click on add, it adds bookmark to bookmark list
         */
        function bookMarkRound() {
            var temp = vm.selectedSchool;

            if (vm.selectedRound === 1) {
                temp.selectedRound = temp.roundOne;
            } else if (vm.selectedRound === 2) {
                temp.selectedRound = temp.roundTwo;
            } else if (vm.selectedRound === 3) {
                temp.selectedRound = temp.roundThree;
            } else if (vm.selectedRound === 4) {
                temp.selectedRound = temp.roundFour;
            } else {
                ohSnap('No Match Found', 'warning');
                console.log('No Match Found');
            }

            if (temp) {
                temp.user_id = $cookies.get('auth');
            }

            schoolsService.bookmarks.save(temp, function(obj) {
                vm.bookmarkedSchools.push(obj);
                ohSnap(temp.school + ' bookmarked', 'green');
            }, function(error) {
                ohSnap('Fail: ' + error.toString(), 'red');
            });

        }

        /**
         * Function called when ever any bookmark deleted
         * @param  {int} bokmark_id
         */
        function removeBookmark(id) {
            var user = $cookies.get('auth');
            $('.delete-modal.modal').modal({
                onApprove: function() {
                    $http.delete(BASE_URL + '/bookmarks/' + id, {
                        params: {
                            user_id: user
                        }
                    }).success(function(data, status) {
                        vm.bookmarkedSchools = vm.bookmarkedSchools.filter(function(el) {
                            return el._id !== id
                        });
                        ohSnap('Record Removed', 'green');
                        console.log(data, status);
                    }).error(function(error, status) {
                        ohSnap('Error Code: ' + status, 'red');
                    });
                }
            }).modal('show');
        }

        function editHandler(id) {
            var user = $cookies.get('auth');
            var editor1, editor2, editor3;
            $('.edit-modal.modal').modal({
                onShow: function() {
                    $('.essay.ui.accordion').accordion();
                    editor1 = new Simditor({
                        textarea: $('#essay1_editor'),
                        upload: false,
                        tabIndent: true,
                        toolbar: [
                            'bold',
                            'italic',
                            'underline',
                            'ul',
                            'blockquote',
                            'hr'
                        ],
                        toolbarFloat: false,
                        toolbarFloatOffset: 0,
                        toolbarHidden: false,
                        pasteImage: false
                    });
                    editor2 = new Simditor({
                        textarea: $('#essay2_editor')
                    });
                    editor3 = new Simditor({
                        textarea: $('#essay3_editor')
                    });
                },
                onApprove: function() {
                }
            }).modal('show');
        }
        /**
         * Check to tell is school list empty
         * @returns {boolean}
         */
        function isSchoolListEmpty() {
            return !vm.bookmarkedSchools.length > 0;
        }

        /**
         * Add school to bookmarks, it initiates @bookmarkSchool function when finish preprocessing.
         */
        function addSchool() {

            $('.dash-add-school.coupled.modal').modal({
                allowMultiple: false
            });

            // First Modal
            $('.dash-search-school.first.modal').modal({
                onShow: function() {
                    addDropDown = $('.school-list.dropdown').dropdown({
                        onChange: function(school) {
                            debugger;
                            vm.selectedSchool = school;
                        }
                    });
                }
            }).modal('show');

            // Second Modal
            $('.dash-select-session.second.modal').modal({
                onShow: function() {
                    $scope.$apply();
                },
                onHide: function() {
                    vm.selectedRound = '';
                    vm.selectedSchool = {};
                    addDropDown.dropdown('clear');
                },
                onApprove: function() {
                    vm.bookMarkRound();
                }
            }).modal('attach events', '.dash-search-school.first.modal .proceed');
        }

        /**
         * Select round from modal. It Assigns the object corresponding to round number passed
         * @param round
         */
        function selectRound(round) {
            vm.selectedRound = round;
        }

        /**
         * check if round your are passing down is selected or not
         * @param round
         * @returns {boolean}
         */
        function isSelected(round) {
            return vm.selectedRound === round;
        }

        /**
         * check if item in bookmark modal dropdown is selected or not.
         * @returns {{}|*}
         */
        function isDropdownSelected() {
            return vm.selectedSchool;
        }

        /**
         * Show class profile on a new Modal
         * @param profile
         */
        function getClassProfile(profile) {
            vm.classProfile = profile;
            $('.class-profile.modal').modal('show');
        }

        /**
         * Check if the school object you are passing is already bookmarked or not
         * @param school
         * @returns {boolean}
         */
        function isBookmarked(school) {
            if (vm.bookmarkedSchools.length > 0) {
                for (var i = 0; i < vm.bookmarkedSchools.length; i++) {
                    if (vm.bookmarkedSchools[i].school_id === school._id) {
                        return true;
                    }
                }
            }
            return false;
        }

        /**
         * Controller Initializer
         */
        function initController() {

            vm.isLoading = true;

            // Variable Initializations
            schoolsService.rest.query(function(schools) {
                vm.allSchools = schools;
            });
            schoolsService.bookmarks.get({
                user_id: $cookies.get('auth')
            }, function(object) {
                vm.bookmarkedSchools = object;
                vm.isLoading = false;
            });
        }

        $scope.$on('LastElem', function(event){
            $('.action-group .trophy').popup({
                title: 'Class Profile',
                content: 'Details about last year\'s class'
            });
            $('.action-group .write').popup({
                title: 'Application',
                content: 'Edit required Essays & Minor Questions'
            });
            $('.action-group .newspaper').popup({
                title: 'Apply Onsite',
                content: 'Go to on-site Application details'
            });
            $('.action-group .world').popup({
                content: 'Web'
            });
            $('.action-group .remove').popup({
                content: 'Remove School'
            });
        });
    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(dashboardRouter)
        .directive('repeatEnd', function() {
            return function(scope, element, attrs) {
                if (scope.$last){
                    scope.$emit('LastElem');
                }
            };
        });

    dashboardRouter.$inject = ['$stateProvider'];
    function dashboardRouter($stateProvider) {
        $stateProvider.state('dashboard', {
            parent: 'index',
            data: {'requireAuth': true},
            url: '/dashboard',
            views: {
                'content@': {
                    templateUrl: 'components/dashboard/dashboard.tpl.html',
                    controller: 'Dashboard',
                    controllerAs: 'dashboard'
                }
            }
        });

        $stateProvider.state('user-essay', {
            parent: 'dashboard',
            data: {'requireAuth': true},
            url: '/?b_id?s_id',
            views: {
                'content@': {
                    templateUrl: 'components/dashboard/essays.tpl.html',
                    controller: 'Essays',
                    controllerAs: 'essays'
                }
            }
        });
    }

}());

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .factory('');

}());
(function () {
    angular
        .module('mba-deadlines')
        .controller('Essays', essaysController);

    essaysController.$inject = ['$scope', '$cookies', '$stateParams', 'essayService'];
    function essaysController($scope, $cookies, $stateParams, essayService) {
        var vm = this;

        vm.data = [];
        vm.isLoading = true;
        vm.crudInProgress = false;

        vm.add = addEssay;
        vm.update = updateEssay;

        initController();

        function addEssay(essay) {
            vm.crudInProgress = true;
            essay.school_id = $stateParams.s_id;
            essay.user_id = $cookies.get('auth');
            delete essay.question;
            delete essay.limit;
            delete essay.required;
            essayService.rest.save(essay, function () {
                vm.crudInProgress = false;
                initController();
            });

        }

        function updateEssay(essay) {
            vm.crudInProgress = true;
            delete essay.question;
            delete essay.limit;
            delete essay.required;
            essayService.rest.update({'essay_id': essay._id}, essay, function (obj) {
                vm.crudInProgress = false;
                initController();
            });
        }

        function initController () {
            vm.isLoading = true;
            essayService.rest.query({'school_id': $stateParams.s_id, 'user_id': $cookies.get('auth')}, function(object) {
                vm.data = object;
                vm.isLoading = false;
            });
        }

    }
}());
(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Deadlines', DeadlinesController);
    DeadlinesController.$inject = ['schoolsService'];
    function DeadlinesController (schoolsService) {

        // Local Variables
        var vm = this;

        // Exposed Variables
        vm.searchQuery = '';
        vm.data = [];
        vm.selectedSchool = {};
        vm.selectedRoud = '';

        // Exposed Functions
        vm.addHover = addHover;
        vm.addSchool = addSchool;
        vm.selectRound = selectRound;
        vm.isSelected = isSelected;
        vm.isLoading = false;

        init();

        // Function Definitions
        function addHover ( deadline ) {
            // Shows/hides the add button on hover
            return deadline.showAdd = ! deadline.showAdd;
        }

        function addSchool (school) {
            vm.selectedSchool = school;
            $('.uni-details-modal.ui.modal')
                .modal({
                    onHide: function () {
                        vm.selectedRoud = '';
                    }
                })
                .modal('show');
        }

        function selectRound ( round ) {
            vm.selectedRoud = round;
        }

        function isSelected ( round ) {
            return vm.selectedRoud === round;
        }

        function init() {
            vm.isLoading = true;
            schoolsService.rest.query(function(schools) {
                vm.data = schools;
                vm.isLoading = false;
            });
        }

    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(deadlinesRouter);

    deadlinesRouter.$inject = ['$stateProvider'];
    function deadlinesRouter($stateProvider) {
        $stateProvider.state('deadlines', {
            parent: 'index',
            url: '/deadlines',
            views: {
                'content@': {
                    templateUrl: 'components/deadlines/deadlines.tpl.html',
                    controller: 'Deadlines',
                    controllerAs: 'deadlines'
                }
            }
        });
    }

}());

(function() {
	'use strict';

	angular
		.module('mba-deadlines')
		.controller('LandingPage', LandingPageController);

	function LandingPageController() {
		var vm = this;

		vm.launchModal = launchModal;

		function launchModal () {
			$('.how-it-works.ui.modal').modal('show');
		}
	}
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(landingPageRouter);

    landingPageRouter.$inject = ['$stateProvider'];
    function landingPageRouter($stateProvider) {
        $stateProvider.state('landing-page', {
            parent: 'index',
            url: '/home',
            views: {
                'content@': {
                    templateUrl: 'components/landing-page/landing-page.tpl.html',
                    controller: 'LandingPage',
                    controllerAs: 'LP'
                }
            }
        });
    }

}());

/**
 * Created by ghazala on 08/08/2015.
 */

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Login', LoginController);
    LoginController.$inject = ['$state', '$cookies', 'userService', '$rootScope'];

    function LoginController($state, $cookies, userService, $rootScope) {
        var vm = this;

        // Exposed Variables
        vm.email = '';
        vm.password = '';
        vm.rememberFlag = false;

        // Exposed Methods
        vm.auth = login;

        function login() {

            userService.rest.post({email: vm.email, password: vm.password}, function (obj) {
                if (obj._id) {
                    $cookies.put('auth', obj._id);
                    $rootScope.portalUser = obj;
                    $state.go('dashboard');
                } else {
                    ohSnap('Email/Password not valid', 'red');
                }
            });
        }

    }
}());

/**
 * Created by ghazala on 08/08/2015.
 */
(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(loginRouter);

    loginRouter.$inject = ['$stateProvider'];
    function loginRouter($stateProvider) {
        $stateProvider.state('login', {
            parent: 'index',
            url: '/login',
            views: {
                'content@': {
                    templateUrl: 'components/login/login.tpl.html',
                    controller: 'Login',
                    controllerAs: 'login'
                }
            }
        });
    }

}());


(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Rankings', RankingsController);
    // RankingsController.$inject = ['$scope'];
    function RankingsController() {

        var vm = this;

        vm.searchQuery = '';

        vm.data = [{
            "id": 1,
            "icon": "images/uni-badges/cambridge.png",
            "school": "Cambridge",
            "address": "Cambridge, England, United Kingdom",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["2", "down"],
            "usNews": ["2", "down"]
        }, {
            "id": 2,
            "icon": "images/uni-badges/stanford.png",
            "school": "Stanford University",
            "address": "450 Serra Mall, Stanford, CA 94305, United States",
            "financial": ["4", "down"],
            "businessWeek": ["3", "down"],
            "economist": ["4", "down"],
            "usNews":["3", "minus"]
        }, {
            "id": 3,
            "icon": "images/uni-badges/harvard.png",
            "school": "Harvard University",
            "address": "Cambridge, MA 02138, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "up"],
            "economist": ["2", "down"],
            "usNews": ["3", "minus"]
        }, {
            "id": 4,
            "icon": "images/uni-badges/mit.png",
            "school": "MIT",
            "address": "77 Massachusetts Ave, Cambridge, MA 02139, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["1", "up"],
            "usNews": ["4", "down"]
            }, {
            "id": 5,
            "icon": "images/uni-badges/yale.png",
            "school": "Yale University",
            "address": "New Haven, CT 06520, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "up"],
            "economist": ["3", "down"],
            "usNews": ["3", "minus"]
            }, {
            "id": 6,
            "icon": "images/uni-badges/oxford.png",
            "school": "University of Oxford",
            "address": "Oxford, England, United Kingdom",
            "financial": ["3", "minus"],
            "businessWeek": ["2", "up"],
            "economist": ["2", "down"],
            "usNews": ["3", "minus"]
            }, {
            "id": 7,
            "icon": "images/uni-badges/columbia.png",
            "school": "Columbia University",
            "address": "116th St & Broadway, New York, NY 10027, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["1", "up"],
            "usNews": ["1", "up"]
            }, {
            "id": 8,
            "icon": "images/uni-badges/nyu.png",
            "school": "New York University",
            "address": "New York, NY, United States",
            "financial": ["1", "up"],
            "businessWeek": ["2", "down"],
            "economist": ["2", "down"],
            "usNews": ["5", "down"]
            }
        ];

        vm.getRankStatus = getRankStatus;

        function getRankStatus (status) {
            var ret = '';
            if (status === 'up') {
                ret = 'up green';
            } else if (status === 'down') {
                ret = 'down red';
            } else {
                ret = 'minus yellow';
            }
            return ret;
        }
    }
}());

(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(rankingsRouter);

    rankingsRouter.$inject = ['$stateProvider'];
    function rankingsRouter($stateProvider) {
        $stateProvider.state('rankings', {
            parent: 'index',
            url: '/rankings',
            views: {
                'content@': {
                    templateUrl: 'components/rankings/rankings.tpl.html',
                    controller: 'Rankings',
                    controllerAs: 'rankings'
                }
            }
        });
    }

}());

/**
 * Created by ghazala on 08/08/2015.
 */

(function() {
    'use strict';

    angular
        .module('mba-deadlines')
        .controller('Signup', SignupController);
    SignupController.$inject = ['$state', 'userService', '$cookies', '$rootScope'];

    function SignupController($state, userService, $cookies, $rootScope)  {
        var vm = this;
        vm.state = $state;
        vm.user = {};
        vm.valid = false;

        init();
        // Exposed Variables
        // Exposed Methods
        vm.addUser = addUser;

        // Function definitions
        function addUser () {
            $rootScope.isLoading = true;
            // Email
            vm.valid = vm.user.email;
            // PW
            vm.valid = vm.user.password;
            // FName
            vm.valid = vm.user.first_name;
            // LName
            vm.valid = vm.user.last_name;

            if (vm.valid) {
                userService.data.save(vm.user, function (user) {
                    $cookies.put('auth', user._id);
                    $rootScope.isLoading = false;
                    $state.go('step2');
                }, function (obj) {
                    debugger;
                    ohSnap(obj.data.error, 'Red');
                    $rootScope.isLoading = false;
                });
            } else {
                ohSnap('Incomplete Data', 'Red');
                $rootScope.isLoading = false;
            }
            debugger;
        }

        function init() {
            $('.salutation.ui.dropdown').dropdown({
                onChange: function (val) {
                    vm.user.salutation = val;
                }
            });
            $('.country.ui.dropdown').dropdown({
                onChange: function (val) {
                    vm.user.country = val;
                }
            });
            $('.signup.form').form({
                on: 'blur',
                fields: {
                    email: {
                        identifier  : 'email',
                        rules: [
                            {
                                type   : 'empty',
                                prompt : 'email is required'
                            },
                            {
                                type   : 'email',
                                prompt : 'Please enter a valid e-mail'
                            }
                        ]
                    },
                    password: {
                        identifier : 'password',
                        rules: [
                            {
                                type   : 'empty',
                                prompt : 'Please enter a password'
                            },
                            {
                                type   : 'minLength[6]',
                                prompt : 'Your password must be at least 6 characters'
                            }
                        ]
                    },
                    name: {
                        identifier : 'name',
                        rules: [
                            {
                                type   : 'empty',
                                prompt : 'Name is required field'
                            }
                        ]
                    },
                    salutation: {
                        identifier : 'salutation',
                        rules: [
                            {
                                type   : 'empty',
                                prompt : 'Salutation is required field'
                            }
                        ]
                    }
                }
            });
        }
    }
}());

/**
 * Created by ghazala on 08/08/2015.
 */
(function() {
    "use strict";

    angular
        .module('mba-deadlines')
        .config(signupRouter);

    signupRouter.$inject = ['$stateProvider'];
    function signupRouter($stateProvider) {
        $stateProvider.state('signup', {
            parent: 'index',
            url: '/signup',
            redirectTo: 'step1',
            views: {
                'content@': {
                    templateUrl: 'components/signup/signup.tpl.html',
                    controller: 'Signup',
                    controllerAs: 'su'
                }
            }
        });
    }

}());

