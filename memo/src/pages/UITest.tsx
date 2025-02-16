import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List } from "lucide-react";

const UITest = () => {
  const [activeTab, setActiveTab] = useState('note');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">UI配置テスト</h1>

      {/* 案1: 最上部タブ方式 */}
      <div className="mb-12 border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">案1: 最上部タブ方式</h2>
        <div className="space-y-4">
          {/* メインタブ */}
          <Tabs defaultValue="note" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="note" className="flex-1">ノート</TabsTrigger>
              <TabsTrigger value="memo" className="flex-1">メモ</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* サブタブとビュー切り替え */}
          <div className="flex gap-4 items-center">
            <Tabs defaultValue="all" className="flex-1">
              <TabsList>
                <TabsTrigger value="all">すべて</TabsTrigger>
                <TabsTrigger value="work">仕事</TabsTrigger>
                <TabsTrigger value="study">勉強</TabsTrigger>
                <TabsTrigger value="private">プライベート</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs defaultValue="newest" className="flex-1">
              <TabsList>
                <TabsTrigger value="newest">新しい順</TabsTrigger>
                <TabsTrigger value="oldest">古い順</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 案2: サイドバー方式 */}
      <div className="mb-12 border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">案2: サイドバー方式</h2>
        <div className="flex gap-6">
          {/* サイドバー */}
          <div className="w-48 space-y-2">
            <Button
              variant={activeTab === 'note' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('note')}
            >
              ノート
            </Button>
            <Button
              variant={activeTab === 'memo' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('memo')}
            >
              メモ
            </Button>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 space-y-4">
            <div className="flex gap-4">
              <Tabs defaultValue="all" className="flex-1">
                <TabsList>
                  <TabsTrigger value="all">すべて</TabsTrigger>
                  <TabsTrigger value="work">仕事</TabsTrigger>
                  <TabsTrigger value="private">プライベート</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs defaultValue="newest" className="flex-1">
                <TabsList>
                  <TabsTrigger value="newest">新しい順</TabsTrigger>
                  <TabsTrigger value="oldest">古い順</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* 案3: ヘッダー統合方式 */}
      <div className="mb-12 border p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">案3: ヘッダー統合方式</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Tabs defaultValue="note" className="flex-shrink-0">
              <TabsList>
                <TabsTrigger value="note">ノート</TabsTrigger>
                <TabsTrigger value="memo">メモ</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex-1 flex gap-4">
              <Tabs defaultValue="all" className="flex-1">
                <TabsList>
                  <TabsTrigger value="all">すべて</TabsTrigger>
                  <TabsTrigger value="work">仕事</TabsTrigger>
                  <TabsTrigger value="private">プライベート</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs defaultValue="newest" className="flex-1">
                <TabsList>
                  <TabsTrigger value="newest">新しい順</TabsTrigger>
                  <TabsTrigger value="oldest">古い順</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UITest;
