'use strict';
app.controller('agentListController', ['$scope', '$http', '$state', '$stateParams', '$timeout', '$modal', 'request', 'dialog',
    function ($scope, $http, $state, $stateParams, $timeout, $modal, request, dialog) {
        $scope.user = app["user"];
        //判断用户是否登录
        if ($scope.user === null || $scope.user === undefined) {
            $state.go('access.signin');
            return;
        }
        //初始修改的uid
        $scope.EditAgentUid = '';
        //判断是否是第一次进入页面 设置初始pid
        if (parseInt($stateParams.pid) == 0) {
            $scope.pid = app['user'].uid;
        } else {
            $scope.pid = parseInt($stateParams.pid);
        }

        $scope.searchUID = '';
        //总页面开关
        $scope.inited = false;
        //表详情开关
        $scope.showDetail = false;
        var date = new Date();
        var str = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
        $scope.dateBegin = str;
        $scope.dateEnd = str;
        $scope.openedStart = false;
        $scope.openedEnd = false;
        $scope.format = "yyyy/MM/dd";
        $scope.altInputFormats = ['yyyy/M!/d!'];
        //日期选择组件
        $scope.openStart = function () {
            $scope.openedStart = true;
        };
        $scope.openEnd = function () {
            $scope.openedEnd = true;
        };
        //页面刷新控制
        $scope.inited = false;

        //分页初始化
        $scope.pageId = 0;
        //页面显示条数
        $scope.pageSize = 10;
        //总页面
        $scope.pageNum = 1;
        //搜索类型
        $scope.searchFlag = "";
        //是否清除页面
        $scope.pageClear = false;

        //分页逻辑
        $scope.pageroll = function (id) {
            switch (id) {
                //首页
                case 0:
                    $scope.pageId = 0;
                    break;
                //上一页
                case -1:
                    if ($scope.pageId > 0)
                        $scope.pageId -= 1;
                    break;
                //下一页
                case 1:
                    if ($scope.pageId < $scope.pageNum - 1)
                        $scope.pageId += 1;
                    break;
                //最后一页
                case 2:
                    $scope.pageId = $scope.pageNum - 1;
                    break;
            }
            //判断使用何种分页
            if ($scope.searchFlag === 'byUid') {
                $scope.searchByUID();
            } else if ($scope.searchFlag === 'byDate') {
                searchByDataAction();
            } else {
                var cond = {uid: $scope.user.uid, pid: $scope.pid, pageId: $scope.pageId, pageSize: $scope.pageSize};
                request.request('/user/getAgents', cond, true)
                    .then(function (data) {
                        console.log(data);
                        $scope.agents = data.data !== null ? data.data : [];
                        $scope.pageId = data.page.id;
                        $scope.pageNum = data.page.num;
                        $timeout(function () {
                            $('.table').trigger('footable_redraw');
                            $timeout(function () {
                                $scope.inited = true;
                            }, 100);
                        }, 10);
                    });
            }
        };

        //日期初始化
        $scope.initDate = date;

        //日期查询按钮 (重置页码)
        $scope.searchByDate = function () {
            //是否清除页面
            $scope.pageClear = true;
            searchByDataAction()
        };

        //根据日期查询
        function searchByDataAction() {
            //页面模块关闭
            $scope.inited = false;
            var begin = new Date($scope.dateBegin);
            var end = new Date($scope.dateEnd);
            var cond = {uid: $scope.user.uid, pid: $scope.pid, pageSize: $scope.pageSize};
            if (begin > end) {
                dialog.showError("错误", "起始日期不能大于截止日期");
                return;
            }
            //根据日期搜索
            else if ($scope.dateBegin != null && $scope.dateEnd != null) {
                var strBegin = begin.getFullYear() + '/' + (begin.getMonth() + 1) + '/' + begin.getDate();
                var strEnd = end.getFullYear() + '/' + (end.getMonth() + 1) + '/' + end.getDate();
                cond['begin'] = strBegin;
                cond['end'] = strEnd;
                //默认搜索
            } else if ($scope.dateBegin == null || $scope.dateEnd == null) {
                var today = new Date();
                var _today = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
                cond['begin'] = _today;
                cond['end'] = _today;
            }
            //判断是否需要刷新初始页面
            if ($scope.pageClear) {
                //刷新初始页面
                $scope.pageId = 0;
                //还原刷新开关
                $scope.pageClear = false;
            }
            cond['pageId'] = $scope.pageId;

            $scope.searchFlag = 'byDate';
            request.request('/user/getAgents', cond, true)
                .then(function (data) {
                    $scope.agents = data.data !== null ? data.data : [];
                    console.log(data);
                    $scope.pageId = data.page.id;
                    $scope.pageNum = data.page.num;
                    $timeout(function () {
                        $('.table').trigger('footable_redraw');
                        $timeout(function () {
                            $scope.inited = true;
                        }, 100);
                    }, 10);
                });

        }

        //根据UID查询
        $scope.searchByUID = function () {
            if ($scope.searchUID != null && $scope.searchUID > 0) {
                $scope.inited = false;
                var cond = {uid: $scope.user.uid, pid: $scope.searchUID};
                request.request('/user/agent', cond)
                    .then(function (data) {
                        if (data == null) {
                            dialog.showError('错误', '该代理不存在');
                            $scope.inited = true;
                            return;
                        }
                        $scope.agents = data != null ? data : [];
                        console.log($scope.agents);
                        $timeout(function () {
                            $('.table').trigger('footable_redraw');
                            $timeout(function () {
                                $scope.inited = true;
                            }, 100);
                        }, 10);
                        //分页初始化
                        $scope.pageId = 0;
                        //总页面
                        $scope.pageNum = 1;
                        //竖旗
                        $scope.searchFlag = 'byUid';
                        console.log(data);
                    });
            } else {
                dialog.showError('错误', '请输入UID');
            }
        };

        //开通代理
        $scope.openAuditAgent = function () {
            var modalInstance = $modal.open({
                templateUrl: 'registerAgentModal.html',
                controller: 'registerAgentModalController',
                resolve: {
                    agentLevel: function () {
                        return '代理等级';
                    }
                }
            });

            $scope.selectLevelInt = 1;
            modalInstance.result.then(function (data) {
                $scope.uid = data.uid;
                $scope.selectLevelInt = data.selectLevelInt;
                $scope.agentCode = '' + data.agentCode;
                $scope.recommender = data.recommender;
                $scope.switch = data.switch;
                $scope.pwd = data.pwd;
                //todo:启东去除
                // $scope.bonusPercent = data.bonusPercent == undefined ? 0 : data.bonusPercent;
                //十三水去除
                $scope.phoneNumber = data.phoneNumber;
                //判断是否需要代注册
                if ($scope.switch === true) {
                    var cond = {
                        uid: app.user.uid, pid: $scope.uid,
                        recommender: $scope.recommender,
                        type: 1,
                        audit: $scope.selectLevelInt
                    };
                } else {
                    var cond = {
                        uid: app.user.uid, pid: $scope.uid,
                        recommender: app.user.isAgent ? app.user.uid : 0,
                        type: 1,
                        audit: $scope.selectLevelInt
                    };
                }
                // 审核
                request.request('/user/auditAgent', cond)
                    .then(function (data) {
                        if (data === 1) {
                            // 代注册
                            request.request('/user/register', {
                                uid: $scope.uid,
                                mail: '',
                                pwd: $scope.pwd,
                                //todo:启东去除
                                // bonusPercent: parseInt($scope.bonusPercent),
                                //todo:十三水去除
                                phoneNumber: $scope.phoneNumber,
                                agentCode: $scope.agentCode,
                                willLogin: false
                            })
                                .then(function (data) {
                                    if (data !== null && data.uid === $scope.uid) {
                                        dialog.showInfo('消息', '开通代理成功!');
                                    } else {
                                        request.request('/user/auditAgent', {
                                            uid: app.user.uid, pid: $scope.uid,
                                            recommender: app.user.isAgent ? app.user.uid : 0,
                                            type: 1, audit: 0
                                        });
                                        //dialog.showError('消息', '开通代理失败,请稍后再试!');
                                    }
                                });
                        } else {
                            dialog.showError('错误', '玩家已经注册,开通代理失败,请稍后再试!');
                        }
                    });
            });
        };

        //修改代理权限
        $scope.openEditAgent = function (uid ,locked) {
            //判断玩家是否已经被封号,不过已被封号 则不能修改权限
            if(locked == 1){
                dialog.showError('','该代理已被封号,请解封后再修改');
                return;
            }
            $scope.EditAgentUid = uid;
            //判断是否是自己操作自己
            if ($scope.user.uid === $scope.EditAgentUid) {
                dialog.showError('', '不能修改自己的权限!');
                return;
            }
            var modalInstance = $modal.open({
                templateUrl: 'editAgentModal.html',
                controller: 'editAgentModalController',
                resolve: {
                    agentLevel: function () {
                        return '修改代理等级';
                    }
                }
            });
            $scope.selectLevelInt = 1;
            modalInstance.result.then(function (data) {
                $scope.selectLevelInt = data.selectLevelInt == undefined ? 1 : data.selectLevelInt;
                //todo:启东去除
                // $scope.bonusPercent = data.bonusPercent == undefined ? 0 : data.bonusPercent;
                //修改代理等级
                request.request('/user/auditAgent', {
                    uid: $scope.user.uid,
                    pid: $scope.EditAgentUid,
                    type: 3,
                    audit: $scope.selectLevelInt
                }, true)
                    .then(function (result) {
                        //如果不等于1 则代表设置失败
                        // if (result.data != 1) {
                        //     dialog.showError('', '修改失败,请稍后再试!');
                        //     return;
                        // }
                        // todo:启东去除
                        //继续执行修改佣金比例
                        // request.request('/user/setBonusPercent', {
                        //     uid: $scope.user.uid,
                        //     pid: $scope.EditAgentUid,
                        //     bonusPercent: $scope.bonusPercent
                        // }, true)
                        //     .then(function (result) {
                                if (result.data == 1) {
                                    dialog.showSuccess('', '修改成功');
                                    //根据当前flag 判断刷新页面类型
                                    if ($scope.searchFlag === 'byUid') {
                                        $scope.searchByUID();
                                    } else {
                                        searchByDataAction();
                                    }
                                    return;
                                } else {
                                    dialog.showError('', '修改失败,请稍后再试!');
                                    return;
                                }
                        //     });
                    });
            });
        };

        //代理封号
        $scope.agentLock = function () {
            var modalInstance = $modal.open({
                templateUrl: 'agentLockModal.html',
                controller: 'agentLockModalController',
                resolve: {
                    agentLevel: function () {
                        return '代理封停';
                    }
                }
            });

            modalInstance.result.then(function (data) {
                $scope.pid = data.pid;
                //玩家封停
                request.request('/user/auditAgent', {uid: $scope.user.uid, pid: $scope.pid, type: 0, audit: -1}, true)
                    .then(function (data) {
                        console.log(data);
                        if (data.data === 1) {
                            dialog.showSuccess('', '代理封停成功!');
                            return;
                        } else {
                            dialog.showError('', '代理封停失败!');
                            return;
                        }
                    });
                //页面刷新
                if ($scope.searchFlag === 'byUid') {
                    $scope.searchByUID();
                } else if ($scope.searchFlag === 'byDate') {
                    searchByDataAction();
                }
            });
        };

        //刷新按钮
        $scope.refresh = function () {
            $scope.inited = false;
            if ($scope.searchFlag === 'byUid') {
                $scope.searchByUID();
            } else if ($scope.searchFlag === 'byDate') {
                searchByDataAction();
            } else {
                var cond = {uid: $scope.user.uid, pid: $scope.pid, pageId: $scope.pageId, pageSize: $scope.pageSize};
                request.request('/user/getAgents', cond, true)
                    .then(function (data) {
                        $scope.agents = data.data !== null ? data.data : [];
                        $scope.pageId = data.page.id;
                        $scope.pageNum = data.page.num;
                        $scope.searchFlag = 'byIndex';
                        $timeout(function () {
                            $('.table').trigger('footable_redraw');
                            $timeout(function () {
                                $scope.inited = true;
                            }, 100);
                        }, 10);
                    });
            }
        };

        //页面返回
        $scope.back = function () {
            window.history.back();
        };

        //点击进入页面逻辑
        if ($scope.searchUID !== null && $scope.searchUID.length > 0) {
            $scope.searchFlag = 'byUid';
            $scope.searchByUID();
        } else {
            var cond = {uid: $scope.user.uid, pid: $scope.pid, pageId: $scope.pageId, pageSize: $scope.pageSize};
            request.request('/user/getAgents', cond, true)
                .then(function (data) {
                    $scope.agents = data.data !== null ? data.data : [];
                    console.log(data);
                    $scope.pageId = data.page.id;
                    $scope.pageNum = data.page.num;
                    $scope.searchFlag = 'byIndex';
                    $timeout(function () {
                        $('.table').trigger('footable_redraw');
                        $timeout(function () {
                            $scope.inited = true;
                        }, 100);
                    }, 10);
                });
        }

        //获得佣金比例
        $scope.getBonusPercent = function () {
            request.request("/settings/load", {}, false)
                .then(function (data) {
                    if (data != null) {
                        $scope.normal = data.normalRate1;
                        $scope.middle = data.middleRate1;
                        $scope.high = data.highRate1;
                    } else {
                        dialog.showError('', '信息获取失败,请稍后重试');
                        return;
                    }
                });

        };

        $scope.getBonusPercent();

        //设置页面佣金比例
        $scope.setBonusPercent = function (agentLevel) {
            switch (agentLevel) {
                case 3:
                    return $scope.normal;
                    break;
                case 2:
                    return $scope.middle;
                    break;
                case 1:
                    return $scope.high;
                    break;
            }
        };

        //等级格式化
        $scope.formatUID = function (uid) {
            if (uid == 0) {
                return '-';
            }
            return uid;
        }


    }]);

//时间筛选器 输出输出格式 Y-M-d-H:m
app.filter('myTime', function () {
    return function (time) {
        if (time === '') {
            return "新用户,暂无充值记录";
        }
        var datetime = new Date(time);
        var mon = datetime.getMonth() + 1 <= 9 ? '0' + (datetime.getMonth() + 1) : '' + (datetime.getMonth() + 1);
        var day = datetime.getDate() <= 9 ? '0' + datetime.getDate() : datetime.getDate();
        var hour = datetime.getHours() <= 9 ? '0' + datetime.getHours() : datetime.getHours();
        var min = datetime.getMinutes() <= 9 ? '0' + datetime.getMinutes() : datetime.getMinutes();
        return datetime.getFullYear() + '-' + mon + '-' + day + ' ' + hour + ':' + min;
    }
});

//封号状态
app.filter('lockFormat', function () {
    return function (lock) {
        switch (lock) {
            case 0:
                return '正常';
            case 1:
                return '封停';
        }
        return '';
    }
});