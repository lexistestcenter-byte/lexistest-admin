"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { QuestionType } from "@/components/questions/types";
import { questionTypeInfo } from "./constants";

export function QuestionTypeSelector({
  onSelect,
}: {
  onSelect: (type: QuestionType) => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/questions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">문제 유형 선택</h1>
          <p className="text-muted-foreground mt-2">
            어떤 유형의 문제를 만드시겠습니까?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {questionTypeInfo.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => onSelect(type.id)}
                className="flex flex-col items-center p-8 border-2 rounded-2xl bg-white hover:border-primary hover:shadow-lg transition-all group"
              >
                <div className={`p-4 rounded-xl ${type.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-bold">{type.name}</h2>
                <p className="text-muted-foreground">{type.nameKo}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
