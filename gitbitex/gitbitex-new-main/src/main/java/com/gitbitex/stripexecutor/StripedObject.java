/*
 * Copyright (C) 2000-2012 Heinz Max Kabutz
 *
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.  Heinz Max Kabutz licenses
 * this file to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.gitbitex.stripexecutor;

/**
 * 条纹对象接口
 * 用于标识需要按条纹（分组）顺序执行的任务
 * 条纹由对象的标识决定，而非 hashCode 和 equals
 */
public interface StripedObject {
    /**
     * 获取条纹标识
     * @return 条纹标识对象
     */
    Object getStripe();
}
